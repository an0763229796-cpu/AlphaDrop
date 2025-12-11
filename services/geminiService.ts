import { GoogleGenAI } from "@google/genai";
import { ProjectAnalysis, CryptoRankReport } from "../types";
import { getCachedAnalysis, cacheAnalysis } from "./storageService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean and parse JSON from AI response
const parseAIResponse = (text: string | undefined): any => {
  if (!text) return null;
  
  // 1. Remove Markdown Code Blocks case-insensitive
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  // 2. Find JSON start/end
  // We look for the first '{' or '[' and the last '}' or ']'
  const firstOpenBrace = cleaned.indexOf('{');
  const firstOpenBracket = cleaned.indexOf('[');
  
  let startIndex = -1;
  let endIndex = -1;

  // Determine if it starts with object or array
  if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
    startIndex = firstOpenBrace;
    endIndex = cleaned.lastIndexOf('}');
  } else if (firstOpenBracket !== -1) {
    startIndex = firstOpenBracket;
    endIndex = cleaned.lastIndexOf(']');
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    cleaned = cleaned.substring(startIndex, endIndex + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error. Cleaned text snippet:", cleaned.substring(0, 100));
    return null;
  }
};

// Segment 1: Core Info & Tech
const PROMPT_SEGMENT_1 = `
IMPORTANT: Output strictly raw JSON only. No Markdown. No commentary.
Analyze the crypto project "{PROJECT}" using the "Surf AI" framework. Focus on sections 1, 2, and 4.

CONTEXT: The user is strictly looking for NEW or TRENDING Airdrop opportunities/Protocols. 
SEARCH STRATEGY: Use specific queries like "{PROJECT} crypto airdrop", "{PROJECT} protocol", or "{PROJECT} finance" to identify the correct project.
DISAMBIGUATION: If the name is generic (e.g. "Liquid"), prioritize the specific DeFi/Airdrop project trending recently, not older legacy networks (e.g. distinguish 'Liquid' on Hyperliquid vs 'Liquid Network').

Verify identity by searching for "{PROJECT} official website" and "{PROJECT} official twitter".

Return JSON structure:
{
  "tldr": {
    "summary": "5-10 line summary of what it is, problem solved",
    "problemSolved": "Specific pain point",
    "backers": "Brief mention of key backers",
    "status": "Token/Airdrop status",
    "quickVerdict": "Low" | "Medium" | "High"
  },
  "overview": {
    "category": "e.g. AI Agent, L2, DeFi",
    "targetAudience": "Who uses this?",
    "socials": { "website": "url", "twitter": "url", "docs": "url" }
  },
  "tech": {
    "chain": "Ethereum, Solana, Monad, etc.",
    "architecture": "Brief technical explanation",
    "differentiation": "What makes it unique vs competitors?"
  },
  "sources": [{"title": "string", "uri": "string"}]
}
`;

// Segment 2: Funding & Tokenomics
const PROMPT_SEGMENT_2 = `
IMPORTANT: Output strictly raw JSON only. No Markdown. No commentary.
Analyze the crypto project "{PROJECT}" focusing on sections 3 and 5 (Money & Tokens).

SEARCH STRATEGY: Search for "{PROJECT} crypto funding", "{PROJECT} raise", "{PROJECT} tokenomics", and "{PROJECT} airdrop guide".
Look for data on CryptoRank, Crunchbase, RootData.

Return JSON structure:
{
  "funding": {
    "rounds": [{"stage": "Seed", "amount": "$XM", "investors": ["Name"], "date": "Year"}],
    "keyBackers": ["List Tier 1 VCs like Paradigm, a16z, Binance"],
    "hasTier1Backing": boolean
  },
  "tokenomics": {
    "tokenStatus": "Live" | "Unreleased" | "Confirmed",
    "ticker": "Symbol or TBD",
    "supply": "Total supply or TBD",
    "airdropPrediction": "Details on points system, snapshot, how to farm"
  },
  "sources": [{"title": "string", "uri": "string"}]
}
`;

// Segment 3: Metrics, Sentiment, Verdict
const PROMPT_SEGMENT_3 = `
IMPORTANT: Output strictly raw JSON only. No Markdown. No commentary.
Analyze the crypto project "{PROJECT}" focusing on sections 6, 7, 8, 9, 10.

SEARCH STRATEGY: Search for "{PROJECT} TVL defillama", "{PROJECT} crypto twitter sentiment", and "{PROJECT} competitors".
Determine if "{PROJECT}" fits current hot narratives (Restaking, AI, Parallel EVM).

Return JSON structure:
{
  "metrics": {
    "tvl": "Current TVL or N/A",
    "users": "Active users/wallets estimate",
    "growthComment": "Is it growing fast?"
  },
  "sentiment": {
    "twitterVibe": "Positive" | "Neutral" | "Negative",
    "narrativeFit": "Does it fit hot trends like Restaking, AI, Modular?"
  },
  "competitors": ["List 3 main rivals"],
  "risks": ["List 3 key risks (Audit, Team, Market)"],
  "verdict": {
    "score": number (1-10),
    "finalThoughts": "Conclusion on potential",
    "actionPlan": ["Step 1", "Step 2", "Step 3"]
  },
  "sources": [{"title": "string", "uri": "string"}]
}
`;

// New: CryptoRank Style Report Prompt
const PROMPT_CRYPTORANK = `
IMPORTANT: Output strictly raw JSON only. No Markdown. No commentary.
Act as a Senior Financial Analyst for Crypto VC. Analyze project "{PROJECT}" rigorously.

SEARCH STRATEGY: 
1. Search for "{PROJECT} crypto funding rounds price", "{PROJECT} seed valuation", "{PROJECT} investors".
2. Dig for "Strategic Round" or "Private Round" details often leaked in pitch decks or articles (e.g. Messari, RootData).
3. If specific Price/Valuation is not public, search for "Total Raised" and estimate or explicitly state "Undisclosed".

TASK 1: Extract Financial Data
- Find Rounds (Pre-Seed, Seed, Strategic, Series A).
- Find Price per token in each round. If unknown, use "Undisclosed".
- Find Valuation (FDV) at the time of raise. If unknown, use "Undisclosed".
- Find Vesting Terms (Cliffs, Unlocks).

TASK 2: Investment Verdict (Objective Analysis)
- Analyze the FDV vs Amount Raised ratio. Is it overvalued?
- Analyze the Vesting. Is there impending dump pressure?
- Analyze Investor quality. Are they long-term holders or flippers?
- Provide a clear Rating: "Undervalued", "Fair Value", "Overvalued", or "High Risk".

Return JSON structure:
{
  "projectName": "{PROJECT}",
  "ticker": "Symbol",
  "category": "Category",
  "totalRaised": "$XM (or 'Undisclosed')",
  "rounds": [
    {
      "type": "Seed/Private/Strategic",
      "date": "Month Year",
      "price": "$0.XX or 'Undisclosed'",
      "raised": "$Amount or 'Undisclosed'",
      "valuation": "$FDV or 'Undisclosed'",
      "roi": "ROI e.g. '15x' or 'N/A'",
      "investors": ["List"],
      "unlockTerms": "Vesting details or 'Undisclosed'"
    }
  ],
  "tokenomics": {
    "initialSupply": "Initial Supply",
    "totalSupply": "Max Supply",
    "initialMarketCap": "IMC",
    "fullyDilutedValuation": "Current FDV"
  },
  "investorAnalysis": {
    "tier1Count": number,
    "leadInvestors": ["Names"],
    "commentary": "Brief comment on backing"
  },
  "investmentVerdict": {
    "rating": "Undervalued" | "Fair Value" | "Overvalued" | "High Risk",
    "riskLevel": "Low" | "Medium" | "High" | "Degen",
    "summary": "Objective advice. e.g. 'Good tech but FDV of $1B for seed is too high. Wait for unlock dip.'",
    "pros": ["Pro 1", "Pro 2"],
    "cons": ["Con 1", "Con 2"]
  }
}
`;

// Auto-correction to find Official Socials from Metadata if AI misses them
const autoCorrectSocials = (analysis: ProjectAnalysis, allSources: Array<{title: string, uri: string}>) => {
  if (!analysis.overview.socials.twitter || analysis.overview.socials.twitter === "TBD") {
    const twitterSrc = allSources.find(s => s.uri.includes("twitter.com") || s.uri.includes("x.com"));
    if (twitterSrc) analysis.overview.socials.twitter = twitterSrc.uri;
  }
  
  if (!analysis.overview.socials.website || analysis.overview.socials.website === "TBD") {
    // Basic heuristic: look for "Home" or the project name in title, exclude generic platforms
    const webSrc = allSources.find(s => 
      !s.uri.includes("twitter") && 
      !s.uri.includes("medium") && 
      !s.uri.includes("linkedin") &&
      !s.uri.includes("crunchbase") &&
      !s.uri.includes("defillama") &&
      (s.title.toLowerCase().includes("home") || s.title.toLowerCase().includes("official") || s.title.toLowerCase().includes(analysis.projectName.toLowerCase()))
    );
    if (webSrc) analysis.overview.socials.website = webSrc.uri;
  }
  return analysis;
};

export const analyzeProjectWithGemini = async (projectName: string, skipCache: boolean = false): Promise<ProjectAnalysis> => {
  // 1. Cache Check
  if (!skipCache) {
    const cached = await getCachedAnalysis(projectName);
    if (cached) {
      console.log("Serving from cache:", projectName);
      return cached;
    }
  }

  try {
    // 2. Parallel Execution of 3 Segments
    console.log("Starting parallel analysis for:", projectName);
    
    // Use regex with 'g' flag to replace ALL occurrences of {PROJECT}
    const safeName = projectName.trim();
    
    const [res1, res2, res3] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: PROMPT_SEGMENT_1.replace(/{PROJECT}/g, safeName),
        config: { tools: [{ googleSearch: {} }] }
      }),
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: PROMPT_SEGMENT_2.replace(/{PROJECT}/g, safeName),
        config: { tools: [{ googleSearch: {} }] }
      }),
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: PROMPT_SEGMENT_3.replace(/{PROJECT}/g, safeName),
        config: { tools: [{ googleSearch: {} }] }
      })
    ]);

    // 3. Parse Results
    const data1 = parseAIResponse(res1.text);
    const data2 = parseAIResponse(res2.text);
    const data3 = parseAIResponse(res3.text);

    if (!data1) throw new Error("Failed to parse Segment 1 (Core Info)");
    if (!data2) throw new Error("Failed to parse Segment 2 (Funding)");
    if (!data3) throw new Error("Failed to parse Segment 3 (Verdict)");

    // 4. Merge Data
    const combinedSources = [
      ...(data1.sources || []),
      ...(data2.sources || []),
      ...(data3.sources || []),
      // Extract metadata sources
      ...(res1.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web ? {title: c.web.title, uri: c.web.uri} : null) || []),
      ...(res2.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web ? {title: c.web.title, uri: c.web.uri} : null) || []),
      ...(res3.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web ? {title: c.web.title, uri: c.web.uri} : null) || [])
    ].filter(s => s !== null);

    // Deduplicate sources
    const uniqueSources = Array.from(new Map(combinedSources.map(item => [item.uri, item])).values());

    let finalResult: ProjectAnalysis = {
      projectName: safeName,
      tldr: data1.tldr || {},
      overview: data1.overview || {},
      tech: data1.tech || {},
      funding: data2.funding || {},
      tokenomics: data2.tokenomics || {},
      metrics: data3.metrics || {},
      sentiment: data3.sentiment || {},
      competitors: data3.competitors || [],
      risks: data3.risks || [],
      verdict: data3.verdict || {},
      sources: uniqueSources
    };

    // Auto-correct missing data using verified sources
    finalResult = autoCorrectSocials(finalResult, uniqueSources);

    // 5. Cache & Return
    await cacheAnalysis(safeName, finalResult);
    return finalResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateFundingReport = async (projectName: string): Promise<CryptoRankReport> => {
  try {
    const safeName = projectName.trim();
    console.log("Generating CryptoRank Report for:", safeName);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: PROMPT_CRYPTORANK.replace(/{PROJECT}/g, safeName),
      config: { tools: [{ googleSearch: {} }] }
    });

    const data = parseAIResponse(response.text);
    if (!data) throw new Error("Failed to parse CryptoRank Report");

    return data as CryptoRankReport;
  } catch (error) {
    console.error("Funding Report Error", error);
    throw error;
  }
}

export const batchEvaluateProjects = async (candidates: {name: string, context: string}[]): Promise<any[]> => {
  try {
    const candidateString = candidates.map(c => `${c.name} (${c.context})`).join(", ");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `IMPORTANT: Output strictly raw JSON array only. No Markdown. No conversational text.
      Filter this list of crypto projects based on Airdrop Potential (AZ9 criteria: New, Hot Narrative, Backing).
      List: ${candidateString}
      SEARCH STRATEGY: Verify if these are real active crypto projects with airdrop potential.
      Return JSON array: [{ "name": string, "isMatch": boolean, "score": number, "reason": string }]`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const data = parseAIResponse(response.text);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Batch Evaluate Error", error);
    return [];
  }
};