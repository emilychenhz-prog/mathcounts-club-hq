import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserRole, SessionData } from '../../types';

interface AuthContextType {
    currentUser: User | null;
    session: SessionData;
    loading: boolean;
    logout: () => Promise<void>;
    updateSessionRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // We keep tracking a 'session' with role for backward compatibility 
    // with the rest of the app while transitioning to Firebase Auth.
    const [session, setSession] = useState<SessionData>(() => {
        const saved = localStorage.getItem('mathcounts_session_role');
        const role = saved ? (saved as UserRole) : UserRole.GUEST;
        return { role, userName: '' };
    });

    useEffect(() => {
        localStorage.setItem('mathcounts_session_role', session.role);
    }, [session.role]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                if (user.email?.toLowerCase() === 'emilychen.hz@gmail.com') {
                    setSession({ role: UserRole.ADMIN, userName: user.displayName || user.email || 'User' });
                    setLoading(false);

                    // Auto-heal Emily Chen's real document using her true Firebase UID
                    import('firebase/firestore').then(({ setDoc }) => {
                        getDoc(doc(db, 'users', user.uid)).then(snap => {
                            if (!snap.exists()) {
                                setDoc(doc(db, 'users', user.uid), {
                                    email: 'emilychen.hz@gmail.com',
                                    name: user.displayName || 'Emily Chen',
                                    role: UserRole.ADMIN,
                                    uid: user.uid,
                                    createdAt: new Date().toISOString()
                                }).catch(console.error);
                            }
                        });
                    });
                } else {
                    getDoc(doc(db, 'users', user.uid))
                        .then(docSnap => {
                            let newRole = UserRole.GUEST;
                            if (docSnap.exists()) {
                                newRole = docSnap.data().role;
                            } else {
                                const name = user.displayName || '';
                                newRole = (name.toLowerCase().includes('coach') || name.toLowerCase().includes('admin'))
                                    ? UserRole.COACH
                                    : UserRole.STUDENT;

                                // Auto-migrate older users missing from Firestore
                                import('firebase/firestore').then(({ setDoc }) => {
                                    setDoc(doc(db, 'users', user.uid), {
                                        email: user.email?.toLowerCase() || '',
                                        name: name || 'Unknown',
                                        role: newRole,
                                        uid: user.uid,
                                        createdAt: new Date().toISOString()
                                    }).catch(console.error);
                                });
                            }
                            setSession({ role: newRole, userName: user.displayName || user.email || 'User' });
                            setLoading(false);
                        })
                        .catch(err => {
                            console.error('Failed to fetch role from firestore', err);
                            setSession({ role: UserRole.GUEST, userName: user.displayName || user.email || 'User' });
                            setLoading(false);
                        });
                }
            } else {
                setSession({ role: UserRole.GUEST, userName: '' });
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        await signOut(auth);
        setSession({ role: UserRole.GUEST, userName: '' });
    };

    const updateSessionRole = (role: UserRole) => {
        setSession(prev => ({ ...prev, role }));
    };

    const value = {
        currentUser,
        session,
        loading,
        logout,
        updateSessionRole
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
