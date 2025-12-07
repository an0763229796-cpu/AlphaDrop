import { GoogleGenAI } from "@google/genai";
import { ProjectAnalysis } from "../types";
import { getCachedAnalysis, cacheAnalysis } from "./storageService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Crypto Airdrop Researcher specializing in the "AZ9" methodology. 
Your goal is to analyze crypto projects to determine their "Early" status and Airdrop Potential.

The AZ9 Methodology Criteria:
1. **New Early Projects:** Is this a new account/project? (AresLabs signal)
2. **Narrative:** Does it fit a hot narrative (e.g., Restaking, L2, AI, Modular, ZK)? (Dune signal)
3. **Smart Money:** Are there signs of VC backing (Paradigm, a16z, Binance) or top KOLs following? (Mochi signal)
4. **Events:** Is there a Testnet, Mainnet, or Upgrade (like Dencun) coming up?
5. **On-Chain Activity:** Is there a clear path to interaction (Bridge, Swap, Stake)?

You MUST return the analysis in strictly valid JSON format. 
Do not include any conversational text, markdown formatting, or explanations outside the JSON object.
The JSON object must match this structure:
{
  "projectName": "string",
  "narrative": "string",
  "score": number (1-10),
  "signals": {
    "smartMoney": "string",
    "community": "string",
    "stage": "string"
  },
  "verdict": "string",
  "strategy": ["string"]
}

Always use Google Search to find the latest information about the project.
`;

export const analyzeProjectWithGemini = async (projectName: string, skipCache: boolean = false): Promise<ProjectAnalysis> => {
  // 1. Check Cache (Optimization) - unless skipCache is true
  if (!skipCache) {
    const cached = getCachedAnalysis(projectName);
    if (cached) {
      console.log("Serving from cache:", projectName);
      return cached;
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the crypto project "${projectName}" for airdrop potential using the AZ9 methodology. 
      Search for its recent funding, current development stage (Testnet/Mainnet), and active campaigns (Galxe, Zealy, Points system).
      Return ONLY the JSON object.
      `,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    // 2. Robust JSON Parsing (Fix Error)
    let cleanedText = text.replace(/```json\n?|```/g, "").trim();
    
    // Find the first '{' and last '}' to ignore any text before/after
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    }
    
    let data;
    try {
        data = JSON.parse(cleanedText);
    } catch (e) {
        console.error("JSON Parse Error:", e, "Text:", text);
        throw new Error("Failed to parse analysis results from AI. The model output was not valid JSON.");
    }
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((item: any) => item !== null) || [];

    const result = {
      ...data,
      projectName: projectName, // Ensure consistent naming
      sources
    };

    // 3. Save to Cache
    cacheAnalysis(projectName, result);

    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const batchEvaluateProjects = async (candidates: {name: string, context: string}[]): Promise<any[]> => {
  try {
    const candidateString = candidates.map(c => `${c.name} (${c.context})`).join(", ");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `I have a list of potential crypto projects. Filter them based on the AZ9 Airdrop Checklist:
      1. Is it a "New/Early" project?
      2. Is it in a "Hot Narrative" (L2, Restaking, AI, Modular)?
      3. Is there "Smart Money" or high potential?
      
      List: ${candidateString}
      
      Return a JSON array where each object contains:
      - name: string
      - isMatch: boolean (true if it meets >2 AZ9 criteria)
      - score: number (1-10)
      - reason: string (Short explanation based on checklist)
      
      Return ONLY valid JSON array.
      `,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Return ONLY a raw JSON array. No markdown. Start with [ and end with ].",
      },
    });

    const text = response.text;
    if (!text) return [];

    // Robust Array Parsing
    let cleanedText = text.replace(/```json\n?|```/g, "").trim();
    
    const firstBracket = cleanedText.indexOf('[');
    const lastBracket = cleanedText.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
        cleanedText = cleanedText.substring(firstBracket, lastBracket + 1);
    }

    try {
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Batch Parse Error", e);
        return [];
    }
  } catch (error) {
    console.error("Batch Evaluate Error", error);
    return [];
  }
}