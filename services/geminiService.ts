import { GoogleGenAI, Type } from "@google/genai";

// --- FIXED API CLIENT INITIALIZATION ---
const getAiClient = () => {
  // Use import.meta.env for Vite, and check for both potential key names
  // This is the CRITICAL FIX for the "White Screen" crash
  const apiKey = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("API Key is missing! Check .env file or Vercel settings.");
    // Instead of throwing immediately (which crashes React), we return null
    // The functions below will handle the null case gracefully
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateLatexFromDescription = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key configuration error. Please check settings.");
    
    // We use systemInstruction to enforce the behavior strongly.
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Updated to 2.0 or 1.5 as 2.5 is not standard yet
      config: {
        systemInstruction: `You are an expert mathematical typesetter and reconstruction engine.
        
        CORE OBJECTIVE:
        The user has copied text from a document (PDF, Word, website), and the formatting has been destroyed. Your job is to ignore the line breaks and fragmented appearance and RECONSTRUCT the original complex mathematical equation.

        CRITICAL REASONING STEPS:
        1. Contextual Glueing: Do not interpret lines as separate sentences. If Line 1 is "a + b" and Line 2 is "c + d", check if they form a fraction, a system of equations, or a matrix.
        2. Fraction Detection: If you see a sequence like "numerator", "---", "denominator", convert it to \\frac{numerator}{denominator}.
        3. Symbol Repair: If symbols like square roots or integrals are detached from their arguments, reattach them logically.
        4. Standard Forms: Recognize patterns (e.g., Quadratic Formula, Pythagorean theorem) even if scrambled.

        OUTPUT RULES:
        - Output ONLY the raw LaTeX string.
        - Do NOT include markdown blocks (\`\`\`).
        - Do NOT include labels like "Equation:".`
      },
      contents: {
        role: 'user',
        parts: [{ text: `Here is the scrambled/unstructured text input:\n"""\n${prompt}\n"""` }]
      }
    });

    const text = response.text || "";
    return text.replace(/```latex/gi, '').replace(/```/g, '').trim();
  } catch (error) {
    console.error("Error generating LaTeX:", error);
    // Return a safe error message instead of crashing
    return "\\text{Error: Could not generate LaTeX. Please try again.}";
  }
};

export const generateLatexFromImage = async (base64Data: string, mimeType: string, prompt?: string): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key configuration error. Please check settings.");
    
    // Updated Prompt for Robust OCR and Linear Word Compatibility
    const systemInstruction = `
    Role: You are an advanced "Robust OCR" and "Linear LaTeX" generator optimized for Microsoft Word. 
    
    **OBJECTIVE:**
    Convert mathematical content from images into raw, wrapper-free LaTeX code.
    
    **1. ROBUST OCR CAPABILITIES (Crucial):**
    - **Skew/Rotation:** The image may be tilted, rotated, or photographed at an angle. You must mentally align it and extract the math as if it were perfectly straight.
    - **Blur/Noise:** The image might be blurry, low contrast, or handwritten. Use mathematical context to infer missing strokes or unclear symbols.
    - **Structure Preservation:** Accurately detect multi-line equations. Do NOT merge them into one line. Treat vertical stacking as distinct lines.

    **2. WORD-COMPATIBLE FORMATTING RULES:**
    - **NO Environment Wrappers:** ABSOLUTELY DO NOT use \\begin{align*}, \\begin{equation}, or \\[ ... \\]. Start directly with the math symbols.
    - **NO Ampersands (&):** Forbidden. Do not align equations with &. This breaks Word's linear math editing.
    - **Line Breaks:** Use double backslash \\\\ strictly at the end of every equation line.
    - **Standard Notation:** Use standard LaTeX (e.g., \\frac, \\sqrt) that Word's equation editor recognizes easily.

    **3. OUTPUT FORMAT:**
    - Return ONLY the raw LaTeX string.
    - No markdown code blocks (\`\`\`).
    - No introductory text.

    **Example Output:**
    x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\\\
    \\Rightarrow 2ax + b = \\pm \\sqrt{b^2 - 4ac} \\\\
    \\text{Therefore, } D = b^2 - 4ac
    `;

    const userContext = prompt ? `Additional user context/hint: "${prompt}"` : "";

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Updated to stable model
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `${systemInstruction}\n${userContext}`
          }
        ]
      }
    });
    
    let text = (response.text || "").trim();
    
    // Post-Processing Cleaning
    // 1. Remove Markdown
    text = text.replace(/```latex/gi, '').replace(/```/g, '');
    
    // 2. Remove Environment Wrappers (Safety Net if model ignores prompt)
    text = text.replace(/\\begin\{align\*?\}/g, '')
               .replace(/\\end\{align\*?\}/g, '')
               .replace(/\\begin\{equation\*?\}/g, '')
               .replace(/\\end\{equation\*?\}/g, '')
               .replace(/\\\[/g, '')
               .replace(/\\\]/g, '');

    // 3. Remove Ampersands (Safety Net)
    text = text.replace(/&/g, '');

    // 4. Cleanup Whitespace
    text = text.trim();

    return text;
  } catch (error) {
    console.error("Error converting image to LaTeX:", error);
    return "\\text{Error: Image processing failed. Please try again.}";
  }
};

export const fixBrokenLatex = async (brokenLatex: string): Promise<{ latex: string; explanation: string }> => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key missing");

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `The following LaTeX code is broken or incorrect: "${brokenLatex}". 
      Please fix it and provide a brief explanation of what was wrong.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            latex: { type: Type.STRING, description: "The corrected LaTeX code" },
            explanation: { type: Type.STRING, description: "A brief explanation of the fix" },
          },
          required: ["latex", "explanation"],
        },
      },
    });

    const text = response.text || "{}";
    const json = JSON.parse(text);
    return json;
  } catch (error) {
    console.error("Error fixing LaTeX:", error);
    return { latex: brokenLatex, explanation: "Failed to fix via AI." };
  }
};

export const explainEquation = async (latex: string): Promise<string> => {
  try {
    const ai = getAiClient();
    if (!ai) return "API Key missing.";

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Explain this mathematical equation in simple terms: "${latex}"`,
    });
    return response.text || "Could not generate explanation.";
  } catch (error) {
    console.error("Error explaining equation:", error);
    return "Could not generate explanation.";
  }
};
