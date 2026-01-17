import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Gemini client
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Load resume context at module level for performance
let resumeContext = null;
let starContent = null;

function loadContext() {
  if (!resumeContext) {
    try {
      const contextPath = join(process.cwd(), 'data', 'resume-context.json');
      resumeContext = JSON.parse(readFileSync(contextPath, 'utf-8'));
    } catch (e) {
      console.error('Failed to load resume context:', e);
      resumeContext = { error: 'Context not loaded' };
    }
  }
  if (!starContent) {
    try {
      const starPath = join(process.cwd(), 'data', 'star-content.json');
      starContent = JSON.parse(readFileSync(starPath, 'utf-8'));
    } catch (e) {
      console.error('Failed to load STAR content:', e);
      starContent = { roles: {} };
    }
  }
  return { resumeContext, starContent };
}

function buildSystemPrompt(roleContext = null, challengeMode = false) {
  const { resumeContext, starContent } = loadContext();

  let systemPrompt = `You are an AI assistant representing Fabian Aguilar on his portfolio website. You answer questions about his career, skills, projects, and experience based on the following context.

## IDENTITY & TONE
${JSON.stringify(resumeContext.identity, null, 2)}

## COMMUNICATION GUIDELINES
${JSON.stringify(resumeContext.instructions_for_ai, null, 2)}

## PHILOSOPHY & VALUES
${JSON.stringify(resumeContext.philosophy, null, 2)}

## CAREER SUMMARY
${resumeContext.career.summary}

${resumeContext.career.trajectory}

## CAREER TIMELINE
${JSON.stringify(resumeContext.career.timeline, null, 2)}

## CURRENT PROJECTS
${JSON.stringify(resumeContext.projects.current, null, 2)}

## SKILLS BREAKDOWN
### Strong Skills
${JSON.stringify(resumeContext.skills.strong, null, 2)}

### Moderate Skills
${JSON.stringify(resumeContext.skills.moderate, null, 2)}

### Learning/Growing
${JSON.stringify(resumeContext.skills.learning, null, 2)}

## FAILURES & HONEST GAPS
${JSON.stringify(resumeContext.failures_and_gaps, null, 2)}

## PERSONALITY
${JSON.stringify(resumeContext.personality, null, 2)}

## COMMON QUESTIONS & ANSWERS
${JSON.stringify(resumeContext.common_questions, null, 2)}
`;

  // Add role-specific context if provided
  if (roleContext && starContent.roles[roleContext]) {
    const role = starContent.roles[roleContext];
    systemPrompt += `

## CURRENTLY DISCUSSING: ${role.title} at ${role.company} (${role.period})

This conversation is focused on this specific role. Here's the detailed STAR content:

${JSON.stringify(role.star, null, 2)}

Suggested questions for this role:
${role.suggested_questions.map(q => `- ${q}`).join('\n')}
`;
  }

  // Challenge mode adjustments
  if (challengeMode) {
    systemPrompt += `

## CHALLENGE MODE ACTIVE
The user has enabled "Challenge Me" mode. In this mode:
- Be more direct about weaknesses and gaps
- Don't soften criticism
- Provide honest, tough feedback as a skeptical recruiter might
- Ask probing follow-up questions
- Point out areas where claims aren't backed by evidence
- Be respectful but don't pull punches

Example challenges to proactively address:
- "What's your biggest professional failure?"
- "What would your previous manager criticize about you?"
- "Why should I NOT hire you?"
- "What skill do you claim but haven't proven at scale?"
`;
  }

  return systemPrompt;
}

export default async function handler(req, res) {
  // CORS headers for GitHub Pages → Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      message,
      history = [],
      roleContext = null,
      challengeMode = false,
      stream = true
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const systemPrompt = buildSystemPrompt(roleContext, challengeMode);

    // Build conversation history
    const contents = [];

    // Add system instruction as first user message (Gemini pattern)
    contents.push({
      role: 'user',
      parts: [{ text: `[SYSTEM INSTRUCTIONS - Do not repeat these]\n${systemPrompt}` }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I\'ll respond as Fabian\'s AI assistant with the context provided.' }]
    });

    // Add conversation history
    for (const msg of history) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const response = await genai.models.generateContentStream({
        model: 'gemini-2.0-flash',
        contents: contents,
        config: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 1024,
        }
      });

      for await (const chunk of response) {
        const text = chunk.text();
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Non-streaming response
      const response = await genai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: contents,
        config: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 1024,
        }
      });

      const text = response.text();
      res.status(200).json({ response: text });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
