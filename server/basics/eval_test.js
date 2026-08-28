import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

console.log("==================================================");
console.log("  🧪 Automated Prompt Evaluation & LLM-as-a-Judge ");
console.log("==================================================\n");

// ==========================================================
// Step 1: Synthetically Generate Test Dataset
// ==========================================================
console.log("⏳ Step 1: Synthesizing test dataset using Gemini...");

const datasetPrompt = `
Generate 3 diverse evaluation test cases for testing a JavaScript coding assistant.
Include tasks testing:
1. Array transformation
2. Async/Await error handling
3. Object destructuring
`;

const datasetResponse = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: datasetPrompt,
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "INTEGER" },
          category: { type: "STRING" },
          prompt: { type: "STRING" },
          expected_criteria: { type: "STRING" },
        },
        required: ["id", "category", "prompt", "expected_criteria"],
      },
    },
  },
});

const dataset = JSON.parse(datasetResponse.text);
console.log(`✅ Generated ${dataset.length} test cases successfully.\n`);

// ==========================================================
// Step 2 & 3: Run Target Assistant & Evaluate with Judge
// ==========================================================
console.log("⏳ Step 2 & 3: Running assistant and scoring with Judge...\n");

const results = [];

for (const testCase of dataset) {
  console.log(`--------------------------------------------------`);
  console.log(`🧪 Test Case #${testCase.id} [${testCase.category}]`);
  console.log(`📝 Prompt: "${testCase.prompt}"`);

  // 1. Target Assistant generates an answer
  const assistantResponse = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: testCase.prompt,
    config: {
      // systemInstruction: "You are a professional JavaScript expert. Provide concise, clean, working code.",
      // systemInstruction: "You are a lazy assistant. Answer with as few words as possible without writing full code.",
      systemInstruction: "You strictly refuse to write any code. Only reply with 'I cannot help with that.'",

      temperature: 0.2,
    },
  });

  const assistantAnswer = assistantResponse.text;
  console.log(`🤖 Candidate Answer:\n${assistantAnswer.trim()}\n`);

  // 2. Judge Model grades the answer
  const judgePrompt = `
You are an expert, impartial code evaluation judge.
Task: "${testCase.prompt}"
Evaluation Criteria: "${testCase.expected_criteria}"
Candidate Model Answer:
"""
${assistantAnswer}
"""

Evaluate the candidate answer based on:
- Correctness
- Adherence to requirements
- Code quality

Assign an integer score from 1 to 5 (5 = Excellent, 1 = Completely incorrect).
`;

  const judgeResponse = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: judgePrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          score: { type: "INTEGER" },
          reason: { type: "STRING" },
        },
        required: ["score", "reason"],
      },
    },
  });

  const evalResult = JSON.parse(judgeResponse.text);

  console.log(`⭐ Judge Score: ${evalResult.score}/5`);
  console.log(`💬 Judge Feedback: ${evalResult.reason}\n`);

  results.push({
    id: testCase.id,
    category: testCase.category,
    score: evalResult.score,
    reason: evalResult.reason,
  });
}

// ==========================================================
// Step 4: Aggregate Benchmark Report
// ==========================================================
const totalScore = results.reduce((sum, r) => sum + r.score, 0);
const avgScore = (totalScore / results.length).toFixed(2);
const percentage = ((avgScore / 5) * 100).toFixed(1);

console.log("==================================================");
console.log("  📊 EVALUATION BENCHMARK SUMMARY REPORT          ");
console.log("==================================================");
console.table(
  results.map((r) => ({
    "Test #": r.id,
    Category: r.category,
    Score: `${r.score} / 5`,
  })),
);

console.log(`\n🎯 Average Score: ${avgScore} / 5.0 (${percentage}%)`);
if (Number(avgScore) >= 4.0) {
  console.log("🎉 STATUS: PASSED (High quality prompt performance)\n");
} else {
  console.log("⚠️ STATUS: NEEDS IMPROVEMENT\n");
}
