import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { ShieldCheckIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

export interface RegisteredUser {
    email: string;
    name: string;
    role: UserRole;
    uid: string;
    createdAt: string;
}

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<RegisteredUser[]>([]);

    // Fetch users securely from Firestore
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                const usersList: RegisteredUser[] = [];
                querySnapshot.forEach((document) => {
                    usersList.push(document.data() as RegisteredUser);
                });

                setUsers(usersList);
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, []);

    const handleRoleChange = async (email: string, newRole: UserRole, uid: string) => {
        setUsers(prev => prev.map(u => u.email === email ? { ...u, role: newRole } : u));

        try {
            await updateDoc(doc(db, 'users', uid), { role: newRole });
        } catch (err) {
            console.error("Failed to update role", err);
        }
    };

    const handleDeleteAccount = async (email: string, uid: string) => {
        if (confirm(`Are you sure you want to permanently delete the profile for ${email}? They will no longer be able to log in.`)) {
            setUsers(prev => prev.filter(u => u.email !== email));

            try {
                await deleteDoc(doc(db, 'users', uid));
            } catch (err) {
                console.error("Failed to delete user", err);
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <ShieldCheckIcon className="w-8 h-8 text-indigo-600" />
                        Administration panel
                    </h2>
                    <p className="text-slate-500 mt-1">Manage global platform accounts, assign coaches, and monitor system access.</p>
                </div>
            </header>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">Registered Accounts ({users.length})</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">User Profile</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Registered</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Account Role</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => (
                                <tr key={user.email} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold relative">
                                                {user.name.charAt(0).toUpperCase()}
                                                {user.role === UserRole.ADMIN && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
                                                        <ShieldCheckIcon className="w-2.5 h-2.5" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-bold text-slate-700">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-slate-500 font-medium">{user.email}</span>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <span className="text-slate-400 text-sm font-medium">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.email, e.target.value as UserRole, user.uid)}
                                            disabled={user.email.toLowerCase() === 'emilychen.hz@gmail.com'}
                                            className={`font-black text-xs uppercase tracking-widest py-2 px-4 rounded-xl border-2 outline-none appearance-none cursor-pointer transition-all
                        ${user.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                    user.role === UserRole.COACH ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <option value={UserRole.STUDENT}>Student</option>
                                            <option value={UserRole.COACH}>Coach</option>
                                            <option value={UserRole.ADMIN}>Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-8 py-5 text-right w-20">
                                        <button
                                            onClick={() => handleDeleteAccount(user.email, user.uid)}
                                            disabled={user.email.toLowerCase() === 'emilychen.hz@gmail.com'}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300"
                                            title="Delete User Signature"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                                        <UserCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        No registered accounts found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
