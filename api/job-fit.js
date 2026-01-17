import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Gemini client
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Load data at module level
let resumeContext = null;
let skillsData = null;
let resumeItems = null;

function loadData() {
  if (!resumeContext) {
    try {
      resumeContext = JSON.parse(readFileSync(join(process.cwd(), 'data', 'resume-context.json'), 'utf-8'));
    } catch (e) {
      console.error('Failed to load resume context:', e);
    }
  }
  if (!skillsData) {
    try {
      skillsData = JSON.parse(readFileSync(join(process.cwd(), 'data', 'skills.json'), 'utf-8'));
    } catch (e) {
      console.error('Failed to load skills data:', e);
    }
  }
  if (!resumeItems) {
    try {
      resumeItems = JSON.parse(readFileSync(join(process.cwd(), 'data', 'resume-items.json'), 'utf-8'));
    } catch (e) {
      console.error('Failed to load resume items:', e);
    }
  }
  return { resumeContext, skillsData, resumeItems };
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobDescription } = req.body;

    if (!jobDescription || jobDescription.length < 50) {
      return res.status(400).json({
        error: 'Please provide a complete job description (at least 50 characters)'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { resumeContext, skillsData, resumeItems } = loadData();

    const analysisPrompt = `You are a brutally honest career fit analyzer. Your job is to provide a realistic, balanced assessment of how well Fabian Aguilar fits a job description.

## CANDIDATE PROFILE

### Career Summary
${resumeContext?.career?.summary || 'Not available'}

### Career Trajectory
${resumeContext?.career?.trajectory || 'Not available'}

### Skills Breakdown
Strong Skills:
${JSON.stringify(resumeContext?.skills?.strong || [], null, 2)}

Moderate Skills:
${JSON.stringify(resumeContext?.skills?.moderate || [], null, 2)}

Learning/Developing:
${JSON.stringify(resumeContext?.skills?.learning || [], null, 2)}

### Detailed Skills with Confidence
${JSON.stringify(skillsData?.skills || [], null, 2)}

### Experience Items
${JSON.stringify(resumeItems?.items?.filter(i => i.type === 'experience') || [], null, 2)}

### Projects
${JSON.stringify(resumeItems?.items?.filter(i => i.type === 'project') || [], null, 2)}

### Honest Gaps (Self-Reported)
${JSON.stringify(resumeContext?.failures_and_gaps?.honest_gaps || [], null, 2)}

### What Critics Might Say
${JSON.stringify(resumeContext?.failures_and_gaps?.what_critics_say || [], null, 2)}

---

## JOB DESCRIPTION TO ANALYZE
${jobDescription}

---

## YOUR TASK

Provide a JSON response with this exact structure:

{
  "roleTitle": "Extracted or inferred job title",
  "company": "Company name if mentioned, otherwise null",

  "overallFit": {
    "score": <number 0-100>,
    "label": "Strong Match" | "Good Match" | "Partial Match" | "Stretch Role" | "Significant Gap",
    "summary": "2-3 sentence honest summary"
  },

  "matchedRequirements": [
    {
      "requirement": "What the job asks for",
      "candidateEvidence": "How Fabian meets this",
      "strength": "strong" | "moderate" | "partial",
      "confidence": <0-1>
    }
  ],

  "gaps": [
    {
      "requirement": "What the job asks for",
      "currentState": "Where Fabian actually is",
      "severity": "critical" | "notable" | "minor",
      "mitigationPath": "How this could be addressed"
    }
  ],

  "uniqueValue": {
    "differentiators": [
      "What makes Fabian different from typical candidates"
    ],
    "narrative": "1-2 sentences on unique positioning"
  },

  "honestConcerns": [
    "Concerns a recruiter might have, stated directly"
  ],

  "recommendation": {
    "shouldApply": true | false,
    "reasoning": "Direct advice",
    "suggestedApproach": "How to position the application if applying"
  },

  "relevantItems": [
    {
      "itemId": "id from resume-items",
      "relevanceScore": <0-1>,
      "whyRelevant": "Brief explanation"
    }
  ]
}

## GUIDELINES

1. **Be honest, not optimistic.** If there's a gap, say so clearly. Don't spin weaknesses as strengths.

2. **Score realistically.** A career changer with 1 year of coding should not score 90% for a senior engineer role. Use the full range:
   - 80-100: Strong match, meets most requirements with evidence
   - 60-79: Good match, meets core requirements, some gaps
   - 40-59: Partial match, significant growth needed
   - 20-39: Stretch role, would need significant ramp-up
   - 0-19: Not a fit, fundamental skill mismatches

3. **Acknowledge the career change.** Fabian is a sales/teaching professional who recently transitioned to building. This is both a strength (unique perspective) and a gap (less technical depth).

4. **Match specific requirements to specific evidence.** Don't generalize.

5. **Identify unique value honestly.** The combination of enterprise sales + AI building is genuinely rare. But don't oversell.

6. **Consider what this candidate actually brings:** deep customer understanding, communication skills, practical AI tool building, but NOT: CS fundamentals, production engineering experience, team leadership in tech.

Return ONLY valid JSON, no markdown formatting.`;

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
      config: {
        temperature: 0.3, // Lower temperature for more consistent analysis
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    });

    const responseText = response.text();

    // Try to parse as JSON
    try {
      // Clean up response if it has markdown code blocks
      let cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const analysis = JSON.parse(cleanedResponse);

      return res.status(200).json({
        success: true,
        analysis
      });
    } catch (parseError) {
      console.error('Failed to parse analysis:', parseError);
      console.error('Raw response:', responseText);

      // Return a fallback structure with the raw text
      return res.status(200).json({
        success: false,
        error: 'Failed to parse structured analysis',
        rawAnalysis: responseText
      });
    }

  } catch (error) {
    console.error('Job fit API error:', error);
    res.status(500).json({
      error: 'Failed to analyze job fit',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
