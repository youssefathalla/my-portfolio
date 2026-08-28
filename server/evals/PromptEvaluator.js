import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({});

export class PromptEvaluator {
  constructor({ model = "gemini-3.5-flash-lite", maxConcurrent = 3 } = {}) {
    this.model = model;
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Step 1A: Generate diverse test ideas for the task
   */
  async generateUniqueIdeas(taskDescription, promptInputsSpec = {}, numCases = 3) {
    const exampleInputs = Object.entries(promptInputsSpec)
      .map(([k, v]) => `"${k}": "${v}"`)
      .join(", ");

    const prompt = `
Generate ${numCases} unique, diverse ideas for testing a prompt that accomplishes this task:

<task_description>
${taskDescription}
</task_description>

The prompt will receive the following inputs:
<prompt_inputs>
{ ${exampleInputs} }
</prompt_inputs>

Each idea must represent a distinct scenario testing different edge cases, data types, or complexity levels.
`;

    const response = await ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction:
          "You are a test scenario designer specialized in creating diverse, unique testing scenarios.",
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: { type: "STRING" },
        },
      },
    });

    return JSON.parse(response.text);
  }

  /**
   * Step 1B: Fleshes out an idea into specific prompt inputs and solution criteria
   */
  async generateTestCase(taskDescription, idea, promptInputsSpec = {}) {
    const allowedKeys = Object.keys(promptInputsSpec);

    const prompt = `
Generate a single detailed test case for a prompt evaluation based on:

<task_description>
${taskDescription}
</task_description>

<specific_idea>
${idea}
</specific_idea>

Allowed Input Keys: ${JSON.stringify(allowedKeys)}

Requirements:
- Populate realistic, high-quality test data inside "prompt_inputs" for each allowed key.
- Provide 1 to 4 clear, measurable "solution_criteria" strings directly addressing task requirements.
`;

    const inputProperties = {};
    for (const key of allowedKeys) {
      inputProperties[key] = { type: "STRING" };
    }

    const response = await ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: "You are a test case creator specializing in designing evaluation scenarios.",
        temperature: 0.5,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            prompt_inputs: {
              type: "OBJECT",
              properties: inputProperties,
              required: allowedKeys,
            },
            solution_criteria: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
          },
          required: ["prompt_inputs", "solution_criteria"],
        },
      },
    });

    const testCase = JSON.parse(response.text);
    testCase.task_description = taskDescription;
    testCase.scenario = idea;
    return testCase;
  }

  /**
   * Generate full synthetic dataset and save to file
   */
  async generateDataset({ taskDescription, promptInputsSpec = {}, numCases = 3, outputFile = "dataset.json" }) {
    console.log(`💡 Brainstorming ${numCases} diverse test ideas...`);
    const ideas = await this.generateUniqueIdeas(taskDescription, promptInputsSpec, numCases);

    console.log(`📝 Synthesizing detailed test cases for each idea...`);
    const dataset = [];

    for (let i = 0; i < ideas.length; i++) {
      const idea = ideas[i];
      console.log(`   [${i + 1}/${ideas.length}] Building: "${idea.substring(0, 60)}..."`);
      const testCase = await this.generateTestCase(taskDescription, idea, promptInputsSpec);
      testCase.id = i + 1;
      dataset.push(testCase);
    }

    fs.writeFileSync(outputFile, JSON.stringify(dataset, null, 2), "utf-8");
    console.log(`💾 Saved ${dataset.length} test cases to ${outputFile}\n`);
    return dataset;
  }

  /**
   * Step 3: LLM-as-a-Judge grading rubric (1 to 10 scale)
   */
  async gradeOutput(testCase, output, extraCriteria = null) {
    const extraCriteriaSection = extraCriteria
      ? `\nMandatory Requirements (Violation means score of 3 or lower):\n${extraCriteria}\n`
      : "";

    const judgePrompt = `
You are an expert, impartial evaluation judge. Grade the candidate output with EXTREME RIGOR.

Original Task Description:
<task_description>
${testCase.task_description}
</task_description>

Original Inputs:
<task_inputs>
${JSON.stringify(testCase.prompt_inputs, null, 2)}
</task_inputs>

Candidate Solution to Evaluate:
<solution>
${output}
</solution>

Criteria to evaluate:
<criteria>
${testCase.solution_criteria.map((c) => `• ${c}`).join("\n")}
</criteria>
${extraCriteriaSection}

Scoring Guidelines (1-10 Scale):
* 1-3: Fails one or more MANDATORY requirements.
* 4-6: Meets mandatory requirements but has noticeable deficiencies.
* 7-8: Meets mandatory requirements and most secondary criteria (Good).
* 9-10: Flawlessly meets all criteria.
`;

    const response = await ai.models.generateContent({
      model: this.model,
      contents: judgePrompt,
      config: {
        temperature: 0.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            strengths: { type: "ARRAY", items: { type: "STRING" } },
            weaknesses: { type: "ARRAY", items: { type: "STRING" } },
            reasoning: { type: "STRING" },
            score: { type: "INTEGER" },
          },
          required: ["strengths", "weaknesses", "reasoning", "score"],
        },
      },
    });

    return JSON.parse(response.text);
  }

  /**
   * Run evaluation across dataset and generate output.html
   */
  async runEvaluation({
    runPromptFunction,
    datasetFile = "dataset.json",
    extraCriteria = null,
    jsonOutputFile = "output.json",
    htmlOutputFile = "output.html",
  }) {
    const dataset = JSON.parse(fs.readFileSync(datasetFile, "utf-8"));
    const results = [];

    console.log(`🚀 Starting evaluation across ${dataset.length} test cases...\n`);

    for (const testCase of dataset) {
      console.log(`--------------------------------------------------`);
      console.log(`🧪 Test Case #${testCase.id}: ${testCase.scenario}`);

      // 1. Run target prompt
      const output = await runPromptFunction(testCase.prompt_inputs);

      // 2. Judge grade
      const grade = await this.gradeOutput(testCase, output, extraCriteria);

      console.log(`⭐ Score: ${grade.score}/10`);
      console.log(`💬 Reasoning: ${grade.reasoning}\n`);

      results.push({
        test_case: testCase,
        output,
        score: grade.score,
        reasoning: grade.reasoning,
        strengths: grade.strengths,
        weaknesses: grade.weaknesses,
      });
    }

    fs.writeFileSync(jsonOutputFile, JSON.stringify(results, null, 2), "utf-8");

    const htmlReport = this.generateHtmlReport(results);
    fs.writeFileSync(htmlOutputFile, htmlReport, "utf-8");

    const scores = results.map((r) => r.score);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    const passCount = scores.filter((s) => s >= 7).length;
    const passRate = ((passCount / scores.length) * 100).toFixed(1);

    console.log("==================================================");
    console.log("  📊 EVALUATION COMPLETE                          ");
    console.log(`  Average Score : ${avgScore} / 10`);
    console.log(`  Pass Rate (≥7): ${passRate}% (${passCount}/${scores.length})`);
    console.log(`  HTML Report   : ${htmlOutputFile}`);
    console.log("==================================================\n");

    return results;
  }

  /**
   * Step 4: Generate visual HTML dashboard report
   */
  //Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed. [+10 locations]
  generateHtmlReport(evaluationResults) {
    const totalTests = evaluationResults.length;
    const scores = evaluationResults.map((r) => r.score);
    const avgScore = totalTests ? (scores.reduce((a, b) => a + b, 0) / totalTests).toFixed(1) : 0;
    const passedTests = scores.filter((s) => s >= 7).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

    let cardsHtml = "";
    for (const res of evaluationResults) {
      const score = res.score;
      const isPassed = score >= 7;
      //Extract this nested ternary operation into an independent statement.
      let scoreClass;
      if (score >= 8) {
        scoreClass = "score-high";
      } else if (score <= 5) {
        scoreClass = "score-low";
      } else {
        scoreClass = "score-medium";
      }
      //Extract this nested ternary operation into an independent statement.
      let statusPill;
      if (isPassed) {
        statusPill = `<span class="pill pill-pass">PASSED</span>`;
      } else {
        statusPill = `<span class="pill pill-fail">FAILED</span>`;
      }

      const inputsHtml = Object.entries(res.test_case.prompt_inputs || {})
        .map(
          ([k, v]) => `
          <div class="input-item">
            <span class="input-key">${escapeHtml(k)}</span>
            <div class="input-val">${escapeHtml(String(v))}</div>
          </div>
        `,
        )
        .join("");

      const criteriaHtml = (res.test_case.solution_criteria || [])
        .map((c) => `<li><span class="check-icon">✓</span> <span>${escapeHtml(c)}</span></li>`)
        .join("");

      const strengthsHtml = (res.strengths || [])
        .map((s) => `<span class="tag tag-strength">+ ${escapeHtml(s)}</span>`)
        .join("");

      const weaknessesHtml = (res.weaknesses || [])
        .map((w) => `<span class="tag tag-weakness">- ${escapeHtml(w)}</span>`)
        .join("");

      cardsHtml += `
        <div class="test-card ${isPassed ? "status-pass" : "status-fail"}" data-status="${isPassed ? "pass" : "fail"}">
          <div class="card-header">
            <div class="header-left">
              <span class="test-number">Test #${res.test_case.id}</span>
              <h3 class="scenario-title">${escapeHtml(res.test_case.scenario)}</h3>
            </div>
            <div class="header-right">
              ${statusPill}
              <div class="score-badge ${scoreClass}">
                <span class="score-num">${score}</span><span class="score-denom">/10</span>
              </div>
            </div>
          </div>

          <div class="card-grid">
            <!-- Left Column: Inputs & Criteria -->
            <div class="grid-col left-col">
              <div class="section-block">
                <div class="block-title">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                  Prompt Inputs
                </div>
                <div class="inputs-container">
                  ${inputsHtml}
                </div>
              </div>

              <div class="section-block">
                <div class="block-title">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  Solution Criteria
                </div>
                <ul class="criteria-list">
                  ${criteriaHtml}
                </ul>
              </div>
            </div>

            <!-- Right Column: Candidate Output & Judge Assessment -->
            <div class="grid-col right-col">
              <div class="section-block">
                <div class="block-title">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                  Model Output
                </div>
                <div class="output-box">
                  <pre>${escapeHtml(res.output)}</pre>
                </div>
              </div>

              <div class="section-block">
                <div class="block-title">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  Judge Assessment
                </div>
                <div class="judge-feedback">
                  <p class="reasoning-text">${escapeHtml(res.reasoning)}</p>
                  
                  ${
                    strengthsHtml || weaknessesHtml
                      ? `
                    <div class="tags-container">
                      ${strengthsHtml}
                      ${weaknessesHtml}
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prompt Evaluation Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-main: #090d16;
      --bg-card: #111827;
      --bg-card-header: #172033;
      --bg-subtle: #1e293b;
      --border-color: #26334d;
      --border-subtle: #1e293b;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.15);
      --green-bg: rgba(16, 185, 129, 0.12);
      --green-border: #10b981;
      --green-text: #34d399;
      --yellow-bg: rgba(245, 158, 11, 0.12);
      --yellow-border: #f59e0b;
      --yellow-text: #fbbf24;
      --red-bg: rgba(239, 68, 68, 0.12);
      --red-border: #ef4444;
      --red-text: #f87171;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-main);
      color: var(--text-main);
      line-height: 1.6;
      padding: 30px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header & Summary Dashboard */
    .dashboard-header {
      background: linear-gradient(135deg, #131c2e 0%, #1e293b 100%);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 28px 32px;
      margin-bottom: 30px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .title-group h1 {
      font-size: 24px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .title-group p {
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 4px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .stat-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 16px 20px;
    }

    .stat-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-dim);
      font-weight: 700;
      margin-bottom: 6px;
    }

    .stat-metric {
      font-size: 28px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .stat-sub {
      font-size: 14px;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* Controls Bar */
    .controls-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .filter-tabs {
      display: flex;
      gap: 8px;
      background: var(--bg-card);
      padding: 4px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 7px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .tab-btn.active {
      background: var(--accent);
      color: #0f172a;
      box-shadow: 0 2px 8px var(--accent-glow);
    }

    .search-input {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 9px 16px;
      color: var(--text-main);
      font-size: 14px;
      font-family: inherit;
      width: 260px;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: var(--accent);
    }

    /* Cards Stack */
    .cards-stack {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .test-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 15px -2px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .test-card:hover {
      border-color: #3b4d70;
    }

    .card-header {
      background: var(--bg-card-header);
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      gap: 15px;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
      min-width: 300px;
    }

    .test-number {
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      white-space: nowrap;
    }

    .scenario-title {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      line-height: 1.4;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pill {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .pill-pass { background: var(--green-bg); color: var(--green-text); border: 1px solid var(--green-border); }
    .pill-fail { background: var(--red-bg); color: var(--red-text); border: 1px solid var(--red-border); }

    .score-badge {
      padding: 6px 14px;
      border-radius: 8px;
      display: flex;
      align-items: baseline;
      gap: 2px;
      font-weight: 800;
    }

    .score-num { font-size: 18px; }
    .score-denom { font-size: 12px; opacity: 0.7; }

    .score-high { background: var(--green-bg); color: var(--green-text); border: 1px solid var(--green-border); }
    .score-medium { background: var(--yellow-bg); color: var(--yellow-text); border: 1px solid var(--yellow-border); }
    .score-low { background: var(--red-bg); color: var(--red-text); border: 1px solid var(--red-border); }

    /* Card 2-Column Grid */
    .card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 24px;
    }

    @media (max-width: 1024px) {
      .card-grid { grid-template-columns: 1fr; }
    }

    .grid-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-block {
      background: #0d1320;
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 18px;
    }

    .block-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Inputs */
    .input-item {
      margin-bottom: 10px;
    }
    .input-item:last-child { margin-bottom: 0; }

    .input-key {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-dim);
      background: var(--bg-subtle);
      padding: 2px 6px;
      border-radius: 4px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .input-val {
      font-size: 14px;
      color: var(--text-main);
      line-height: 1.5;
      background: rgba(0, 0, 0, 0.2);
      padding: 10px 14px;
      border-radius: 8px;
      border-left: 3px solid var(--accent);
    }

    /* Criteria List */
    .criteria-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .criteria-list li {
      font-size: 14px;
      color: var(--text-muted);
      display: flex;
      align-items: flex-start;
      gap: 8px;
      line-height: 1.5;
    }

    .check-icon {
      color: var(--green-text);
      font-weight: bold;
      flex-shrink: 0;
    }

    /* Output Box */
    .output-box pre {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #93c5fd;
      background: #070a12;
      padding: 14px;
      border-radius: 8px;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.6;
      border: 1px solid #1e293b;
      max-height: 280px;
      overflow-y: auto;
    }

    /* Judge Feedback */
    .reasoning-text {
      font-size: 14px;
      color: var(--text-main);
      line-height: 1.6;
      margin-bottom: 12px;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
    }

    .tag-strength { background: var(--green-bg); color: var(--green-text); border: 1px solid rgba(16, 185, 129, 0.3); }
    .tag-weakness { background: var(--red-bg); color: var(--red-text); border: 1px solid rgba(239, 68, 68, 0.3); }
  </style>
</head>
<body>

  <!-- Dashboard Header -->
  <div class="dashboard-header">
    <div class="header-top">
      <div class="title-group">
        <h1>📊 Prompt Evaluation Benchmark</h1>
        <p>Automated evaluation results & LLM-as-a-Judge assessment breakdown</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Total Tests</div>
        <div class="stat-metric">${totalTests} <span class="stat-sub">Scenarios</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Average Score</div>
        <div class="stat-metric">${avgScore} <span class="stat-sub">/ 10.0</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Pass Rate (≥7/10)</div>
        <div class="stat-metric">${passRate}% <span class="stat-sub">(${passedTests}/${totalTests})</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Failing Tests</div>
        <div class="stat-metric" style="color: ${failedTests > 0 ? "var(--red-text)" : "var(--green-text)"}">
          ${failedTests} <span class="stat-sub">Failed</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Controls & Search -->
  <div class="controls-bar">
    <div class="filter-tabs">
      <button class="tab-btn active" onclick="filterCards('all', this)">All Tests (${totalTests})</button>
      <button class="tab-btn" onclick="filterCards('pass', this)">Passed (${passedTests})</button>
      <button class="tab-btn" onclick="filterCards('fail', this)">Failed (${failedTests})</button>
    </div>
    <input type="text" class="search-input" id="searchBox" placeholder="🔍 Search test cases..." oninput="searchCards(this.value)">
  </div>

  <!-- Cards List -->
  <div class="cards-stack" id="cardsContainer">
    ${cardsHtml}
  </div>

  <script>
    function filterCards(status, btn) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cards = document.querySelectorAll('.test-card');
      cards.forEach(card => {
        if (status === 'all' || card.dataset.status === status) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function searchCards(query) {
      const q = query.toLowerCase();
      const cards = document.querySelectorAll('.test-card');
      cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(q) ? 'block' : 'none';
      });
    }
  </script>
</body>
</html>`;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
