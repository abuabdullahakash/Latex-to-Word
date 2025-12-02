import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  // CRITICAL FIX: Vite requires VITE_ prefix for client-side variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("API Key missing! Please ensure VITE_GEMINI_API_KEY is set in Vercel.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateLatexFromDescription = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) return "\\text{Error: API Key is missing.}";
    
    // Using gemini-1.5-flash as it is the most stable for free tier
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", 
      config: {
        systemInstruction: `You are an expert mathematical typesetter.
        OBJECTIVE: Reconstruct complex mathematical equations from scrambled text.
        RULES:
        1. Contextual Glueing: Join separated lines logically (e.g., numerators and denominators).
        2. Output ONLY raw LaTeX. No markdown, no labels.`
      },
      contents: {
        role: 'user',
        parts: [{ text: `Input: """${prompt}"""` }]
      }
    });

    const text = response.text || "";
    return text.replace(/```latex/gi, '').replace(/```/g, '').trim();
  } catch (error) {
    console.error("Error generating LaTeX:", error);
    return "\\text{Error: Could not process text. Please try again.}";
  }
};

export const generateLatexFromImage = async (base64Data: string, mimeType: string, prompt?: string): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) return "\\text{Error: API Key is missing.}";
    
    const systemInstruction = `
    Role: Expert Math OCR for MS Word.
    Objective: Extract math from image to raw LaTeX.
    
    RULES:
    1. Output ONLY valid raw LaTeX code.
    2. NO markdown (\`\`\`). 
    3. NO \\begin{align} or &. Use \\\\ for new lines.
    4. Handle rotation, blur, and handwritten text.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Stable model
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `${systemInstruction}\n${prompt ? "User Hint: " + prompt : ""}`
          }
        ]
      }
    });
    
    let text = (response.text || "").trim();
    
    // Cleaning
    text = text.replace(/```latex/gi, '').replace(/```/g, '')
               .replace(/\\begin\{align\*?\}/g, '').replace(/\\end\{align\*?\}/g, '')
               .replace(/\\begin\{equation\*?\}/g, '').replace(/\\end\{equation\*?\}/g, '')
               .replace(/\\\[/g, '').replace(/\\\]/g, '')
               .trim();

    return text;
  } catch (error) {
    console.error("Error converting image:", error);
    return "\\text{Error: Image processing failed. Please check your API Key quota.}";
  }
};

export const fixBrokenLatex = async (brokenLatex: string): Promise<{ latex: string; explanation: string }> => {
  try {
    const ai = getAiClient();
    if (!ai) return { latex: brokenLatex, explanation: "API Key missing." };

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Fix this LaTeX: "${brokenLatex}". Provide JSON with 'latex' and 'explanation'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            latex: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["latex", "explanation"],
        },
      },
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    return { latex: brokenLatex, explanation: "Failed to fix." };
  }
};

export const explainEquation = async (latex: string): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) return "API Key missing.";

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Explain this equation simply: "${latex}"`,
    });
    return response.text || "No explanation available.";
  } catch (error) {
    return "Error explaining equation.";
  }
};
