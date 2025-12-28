const axios = require('axios');
require('dotenv').config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';

/**
 * Analyzes resume and JD text using Ollama.
 * @param {string} resumeText 
 * @param {string} jdText 
 * @returns {Promise<Object>} - The JSON result from the AI.
 */
async function analyzeResume(resumeText, jdText) {
    if (!resumeText || !jdText) {
        throw new Error('Missing resume or job description text.');
    }

    // Construct a strict system prompt
    const prompt = `
You are an expert ATS (Applicant Tracking System) resume analyzer. 
Your task is to compare the Resume against the Job Description (JD).

Resume Content:
"${resumeText.substring(0, 12000)}"

Job Description:
"${jdText.substring(0, 12000)}"

Analyze them and return a JSON object with the following structure:
{
  "overall_score": <integer between 0-100>,
  "keyword_matches": ["<list of matching technical keywords>"],
  "missing_keywords": ["<list of important keywords found in JD but missing in Resume>"],
  "formatting_tips": ["<specific advice on formatting>"],
  "improvement_suggestions": ["<actionable advice to improve the resume>"],
  "highlighted_resume": "<Resume text with <mark class='match'>matched_keyword</mark> and <mark class='missing'>missing_keyword_suggestion</mark> inserted>"
}

IMPORTANT:
1. Return ONLY the valid JSON object.
2. Do NOT include markdown formatting like \`\`\`json.
3. ensuring the JSON is valid and parseable.
`;

    try {
        console.log(`[Ollama] Sending request to ${OLLAMA_URL} with model ${MODEL}...`);

        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.2, // Low temperature for consistent JSON
                num_ctx: 2048     // Reduced context for speed
            },
            timeout: 60000 // 60s timeout to prevent infinite hanging
        });

        const rawResponse = response.data.response;
        // console.log('[Ollama] Raw Response:', rawResponse.substring(0, 200) + '...');

        // Robust JSON Extraction
        // Finds the first '{' and the last '}' that form a valid block
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error('No JSON object found in AI response.');
        }

        try {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed;
        } catch (parseError) {
            console.error('[Ollama] JSON Parse Error. Raw text:', jsonMatch[0]);
            throw new Error('AI returned invalid JSON.');
        }

    } catch (error) {
        if (error.response) {
            console.error('[Ollama] API Error:', error.response.status, error.response.data);
        } else {
            console.error('[Ollama] Connection Error:', error.message);
        }
        throw new Error('Failed to analyze resume with AI.');
    }
}

module.exports = { analyzeResume };
