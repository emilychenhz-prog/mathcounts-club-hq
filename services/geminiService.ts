
import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, RoundType, Problem, AnalyzedProblem } from "../types";

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

// Always use the named parameter for apiKey and initialize GoogleGenAI.
const ai = new GoogleGenAI({ apiKey });

export const generateMathProblem = async (difficulty: Difficulty, round: RoundType): Promise<Problem> => {
  const prompt = `Generate a Mathcounts-style math problem for the ${round} round at the ${difficulty} level. 
  Include the question, the numerical answer, a detailed step-by-step explanation, and a category (e.g., Geometry, Algebra, Counting & Probability, Number Theory).`;

  // Always use ai.models.generateContent with model and contents.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
          explanation: { type: Type.STRING },
          category: { type: Type.STRING }
        },
        required: ["question", "answer", "explanation", "category"]
      }
    }
  });

  // Extract text using the .text property (not a method).
  const data = JSON.parse(response.text || '{}');
  return {
    id: Math.random().toString(36).substr(2, 9),
    question: data.question,
    answer: data.answer,
    explanation: data.explanation,
    difficulty,
    round,
    category: data.category
  };
};

export const getAITutorHint = async (problem: string, studentQuery: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `The student is working on this problem: "${problem}". They asked: "${studentQuery}". 
    Provide a helpful hint without giving away the full answer immediately. Guide them toward the logic needed.`,
    config: {
      systemInstruction: "You are a friendly Mathcounts coach. Use encouraging language and focus on mathematical concepts."
    }
  });
  // Use the .text property to access the generated content.
  return response.text || "I'm having trouble thinking of a hint right now. Try looking at the core concepts again!";
};

export const extractProblemDataFromPdf = async (base64Pdf: string): Promise<AnalyzedProblem[]> => {
  const baseConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          problemId: { type: Type.STRING },
          problemSet: { type: Type.STRING },
          category: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          ccssMapping: { type: Type.STRING },
          answer: { type: Type.STRING },
          quiz: { type: Type.STRING },
          quizNumber: { type: Type.STRING }
        },
        required: ["problemId", "problemSet", "category", "difficulty", "ccssMapping", "quiz", "quizNumber"]
      }
    }
  };

  const answersPrompt = `
    Analyze the provided Mathcounts PDF content and extract problem data precisely. 
    Focus ONLY on the Answers / Problem Set sections.
    
    Format Type 1 (Answers Section):
    Pattern: "[Problem ID]. [Answer] ([Difficulty])" 
    Note: The [Answer] can be complex, containing fractions, radicals (roots), or text descriptions. 
    Example 1: "201. 211/243 (4)" -> ID: 201, Answer: 211/243, Difficulty: 4.
    Example 2: "212. 2 cube root 98 (5)" or "212. 2 multiplied by the cube root of 98 (5)" -> ID: 212, Answer: 2 cube root 98 (or exactly as written), Difficulty: 5.
    IMPORTANT: Capture the entire mathematical expression for the answer verbatim.
    Context: The header text above this section is the "Problem Set".
    
    Tasks:
    1. Identify all "Problem Set" headers and their associated Type 1 entries.
    2. Always return empty strings for the "quiz" and "quizNumber" fields.
    3. Return a JSON array of objects.
  `;

  const indexPrompt = `
    Analyze the provided Mathcounts PDF content and extract problem data from the Problem Index / Category Index pages.
    Ignore introductory paragraphs and prose.

    Format Type (Problem Index / Category Index):
    - Look for a "Problem Index" or "Category Index" page with category headers and lists of entries under each category.
    - Each entry typically includes a Problem ID, a Difficulty in parentheses, and a CCSS mapping.
      Example pattern: "21 (4) 8.EE.3" or "121 (5) 7.RP.2".
    - The category is the header label above the list (use the header text as category).
    - Categories may be abbreviated (Cg=Coordinate Geometry, Pc=Probability/Counting, Sd=Statistics & Data, Sg=Solid Geometry, Lo=Logic, Ps=Problem Solving/Misc). Use the full category name.
    - The index page is often a multi-column table; parse all columns.
    - If the column header is in the format "1. 25 (1)" or "26. 50 (2)", treat it as a Problem Set header.
      Use that header text as the problemSet value for all entries in that column.
    - If the column header is a named set (e.g., "WARM-UP 2", "WORKOUT 6", "CHANCE TO WIN STRETCH", "SIMPLIFYING RADICALS STRETCH"),
      use that header text as the problemSet value for all entries in that column.
    - If no column header is present, set problemSet to an empty string.

    Tasks:
    1. Extract all Problem Index entries across all categories.
    2. Always return empty strings for the "quiz" and "quizNumber" fields.
    3. Return a JSON array of objects.
  `;

  const [answersResponse, indexResponse] = await Promise.all([
    ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: answersPrompt },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf
            }
          }
        ]
      },
      config: baseConfig
    }),
    ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { text: indexPrompt },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf
            }
          }
        ]
      },
      config: baseConfig
    })
  ]);

  const answers = JSON.parse(answersResponse.text || '[]') as AnalyzedProblem[];
  const index = JSON.parse(indexResponse.text || '[]') as AnalyzedProblem[];

  const merged = new Map<string, AnalyzedProblem>();
  const mergeItem = (item: AnalyzedProblem) => {
    const key = item.problemId;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, item);
      return;
    }
    merged.set(key, {
      ...existing,
      ...item,
      problemSet: item.problemSet || existing.problemSet,
      category: item.category || existing.category,
      difficulty: item.difficulty || existing.difficulty,
      ccssMapping: item.ccssMapping || existing.ccssMapping,
      answer: item.answer || existing.answer
    });
  };

  answers.forEach(mergeItem);
  index.forEach(mergeItem);

  return Array.from(merged.values());
};

export const extractProblemIndexFromImage = async (base64Image: string): Promise<AnalyzedProblem[]> => {
  const prompt = `
    Extract problem data from the provided Mathcounts Problem Index image.
    Ignore any prose or explanatory paragraphs.

    The index is a multi-column table with category headers and entries beneath.
    Each entry typically looks like: "21 (4) 8.EE.3" where:
    - Problem ID = 21
    - Difficulty = 4
    - CCSS Mapping = 8.EE.3

    Categories may be abbreviated in the headers:
    - Cg = Coordinate Geometry
    - Pc = Probability, Counting & Combinatorics
    - Sd = Statistics & Data
    - Sg = Solid Geometry
    - Lo = Logic
    - Ps = Problem Solving (Misc)

    Use the full category name when returning results.
    If the column header is a named set (e.g., "WARM-UP 2", "WORKOUT 6", "CHANCE TO WIN STRETCH", "SIMPLIFYING RADICALS STRETCH"),
    use it as the problemSet for entries in that column. If not shown, leave it empty.

    Return a JSON array of objects and always include empty strings for "quiz" and "quizNumber".
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image
          }
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            problemId: { type: Type.STRING },
            problemSet: { type: Type.STRING },
            category: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            ccssMapping: { type: Type.STRING },
            answer: { type: Type.STRING },
            quiz: { type: Type.STRING },
            quizNumber: { type: Type.STRING }
          },
          required: ["problemId", "problemSet", "category", "difficulty", "ccssMapping", "quiz", "quizNumber"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};
