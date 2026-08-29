import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { PromptEvaluator } from './evals/PromptEvaluator.js';
import * as fs from 'node:fs';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({});
const evaluator = new PromptEvaluator({ model: 'gemini-3.5-flash-lite' });

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: 'gemini-3.5-flash-lite', timestamp: new Date().toISOString() });
});

/**
 * 📡 Real-Time SSE Streaming Chat
 */
app.post('/api/chat/stream', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const formattedContents = history.map((h) => ({
      role: h.role === 'assistant' ? 'model' : h.role,
      parts: [{ text: h.text }],
    }));

    formattedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const stream = await ai.models.generateContentStream({
      model: 'gemini-3.5-flash-lite',
      contents: formattedContents,
      config: {
        systemInstruction:
          'You are a helpful, expert AI assistant integrated into a modern Angular playground.',
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * 🛠️ Function Calling / Tools Endpoint
 */
app.post('/api/tools/execute', async (req, res) => {
  const { prompt } = req.body;

  const stockPriceTool = {
    name: 'getStockPrice',
    description: 'Retrieves the real-time stock price and change for a given ticker symbol.',
    parameters: {
      type: 'OBJECT',
      properties: {
        ticker: {
          type: 'STRING',
          description: 'Stock ticker symbol (e.g. AAPL, GOOGL, TSLA, NVDA)',
        },
      },
      required: ['ticker'],
    },
  };

  function getStockPrice({ ticker }) {
    const mockDB = {
      AAPL: { price: 232.5, currency: 'USD', change: '+1.4%' },
      GOOGL: { price: 185.2, currency: 'USD', change: '+2.1%' },
      TSLA: { price: 214.8, currency: 'USD', change: '-0.8%' },
      NVDA: { price: 128.4, currency: 'USD', change: '+3.5%' },
    };
    return mockDB[ticker.toUpperCase()] || { error: 'Ticker not found', ticker };
  }

  try {
    const res1 = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt,
      config: { tools: [{ functionDeclarations: [stockPriceTool] }] },
    });

    const calls = res1.functionCalls || [];
    const toolExecutions = [];
    const toolResponseParts = [];

    for (const call of calls) {
      const data = getStockPrice(call.args);
      toolExecutions.push({ name: call.name, args: call.args, result: data });
      toolResponseParts.push({ functionResponse: { name: call.name, response: data } });
    }

    let finalText = '';
    if (calls.length > 0) {
      const finalRes = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
          res1.candidates[0].content,
          { role: 'user', parts: toolResponseParts },
        ],
        config: { tools: [{ functionDeclarations: [stockPriceTool] }] },
      });
      finalText = finalRes.text;
    } else {
      finalText = res1.text;
    }

    res.json({
      calls: toolExecutions,
      answer: finalText,
    });
  } catch (error) {
    console.error('Tools error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📊 Prompt Evaluation Benchmarks API
 * POST /api/evals/run-preset
 * Body: { presetId: "support" | "meeting", customPromptTemplate?: string }
 */
app.post('/api/evals/run-preset', async (req, res) => {
  const { presetId = 'support', customPromptTemplate = '' } = req.body;

  try {
    const datasetPath =
      presetId === 'meeting' ? 'reports/meeting_dataset.json' : 'reports/support_dataset.json';

    if (!fs.existsSync(datasetPath)) {
      return res.status(404).json({ error: `Dataset file not found: ${datasetPath}` });
    }

    const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
    const results = [];

    for (const testCase of dataset) {
      let finalPrompt = '';

      if (customPromptTemplate && customPromptTemplate.trim().length > 0) {
        let compiled = customPromptTemplate;

        // Replace any explicit placeholder variables like {{customer_message}} or {{meeting_transcript}}
        for (const [key, val] of Object.entries(testCase.prompt_inputs)) {
          const placeholder = new RegExp(`{{${key}}}`, 'g');
          if (placeholder.test(compiled)) {
            compiled = compiled.replace(placeholder, String(val));
          }
        }

        // If no {{variable}} placeholders existed, append the structured XML inputs automatically
        const hasReplacedAny = Object.keys(testCase.prompt_inputs).some((k) =>
          customPromptTemplate.includes(`{{${k}}}`),
        );

        if (!hasReplacedAny) {
          const inputXml = Object.entries(testCase.prompt_inputs)
            .map(([k, v]) => `<${k}>\n${v}\n</${k}>`)
            .join('\n\n');
          compiled = `${compiled}\n\n${inputXml}`;
        }

        finalPrompt = compiled;
      } else {
        // Default fallback if no custom prompt provided
        if (presetId === 'support') {
          finalPrompt = `
            Analyze the customer message in <ticket>.
            <ticket>
            ${testCase.prompt_inputs.customer_message}
            </ticket>

            Follow these guidelines:
            - Identify the urgency (High/Medium/Low)
            - Extract Order ID if present
            - State whether a refund is requested
            - Be concise and factual
            `;
        } else {
          finalPrompt = `
            Extract action items from <transcript>:
            <transcript>
            ${testCase.prompt_inputs.meeting_transcript}
            </transcript>
            - List each action item with owner and deadline.
            `;
        }
      }

      // 1. Run Target Prompt (with user's custom instructions)
      const modelResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: finalPrompt,
      });

      const output = modelResponse.text;

      // 2. Judge Evaluation
      const grade = await evaluator.gradeOutput(testCase, output);

      results.push({
        test_case: testCase,
        output,
        score: grade.score,
        reasoning: grade.reasoning,
        strengths: grade.strengths || [],
        weaknesses: grade.weaknesses || [],
        status: grade.score >= 7 ? 'passed' : 'failed',
      });
    }

    // Calculate Summary KPIs
    const totalTests = results.length;
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    const avgScore = totalTests > 0 ? (totalScore / totalTests).toFixed(1) : '0.0';
    const passedCount = results.filter((r) => r.status === 'passed').length;
    const failedCount = totalTests - passedCount;
    const passRate = totalTests > 0 ? ((passedCount / totalTests) * 100).toFixed(0) : '0';

    // Aggregate all weaknesses across test cases
    const allWeaknesses = [...new Set(results.flatMap((r) => r.weaknesses || []))];
    const allStrengths = [...new Set(results.flatMap((r) => r.strengths || []))];

    // Smart Optimization Advice
    const recommendations = [];
    if (allWeaknesses.some((w) => /extra|unrequested|verbose/i.test(w))) {
      recommendations.push("Strictly restrict the model output to only the required fields (tell the model 'Output ONLY these fields with no extra text').");
    }
    if (allWeaknesses.some((w) => /sarcasm|sarcastic/i.test(w))) {
      recommendations.push("Add a specific rule or Few-Shot example showing how to detect sarcastic positive language.");
    }
    if (allWeaknesses.some((w) => /order|id|multiple/i.test(w))) {
      recommendations.push("Add disambiguation instructions to isolate the specific affected Order ID when multiple numbers are present.");
    }
    if (allWeaknesses.length === 0 && Number(avgScore) >= 9.5) {
      recommendations.push("Your prompt is performing at production gold-standard (10/10)! All edge cases and formatting criteria are flawlessly met.");
    }

    res.json({
      summary: {
        totalTests,
        avgScore,
        passedCount,
        failedCount,
        passRate,
        allWeaknesses,
        allStrengths,
        recommendations,
      },
      results,
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Gemini API Server running at http://localhost:${port}`);
});
