
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// create OpenAI client – API key comes from environment variable
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple health check
app.get("/", (req, res) => {
  res.send("Abir AI backend is running ✅");
});

// 1) Smart Study Planner endpoint
app.post("/api/study-plan", async (req, res) => {
  const { topic } = req.body;

  if (!topic || topic.trim().length === 0) {
    return res.status(400).json({ error: "Topic is required." });
  }

  try {
    const response = await client.responses.create({
      model: "gpt-5.1-mini",
      input: [
        {
          role: "user",
          content: `
You are a study planner for a CSE student in Dhaka named Abir.
He has deep-work blocks at 8:00 and 10:00 on Growth days and long commute on class days.

Create a clear, numbered, step-by-step study plan for this topic:
"${topic}"

Constraints:
- Use simple English
- 6–10 steps
- Mention where to use Deep Work blocks vs light review.
          `.trim(),
        },
      ],
    });

    // Responses API: text is in output[0].content[0].text
    const text = response.output[0].content[0].text;

    res.json({ plan: text });
  } catch (err) {
    console.error("Error from OpenAI:", err.message);
    res.status(500).json({ error: "Failed to generate plan." });
  }
});

// 2) Discipline Reset endpoint (for the three buttons)
app.post("/api/discipline-reset", async (req, res) => {
  const { mode } = req.body; // "procrastinating" | "overwhelmed" | "skipped_prayer"

  const modeText =
    mode === "procrastinating"
      ? "Give tough-love, high-energy advice. 3 concrete actions for the next 60 minutes."
      : mode === "overwhelmed"
      ? "Give calm, structured guidance. 3 simple steps to regain control without panic."
      : "He skipped prayer/habits. Give compassionate but firm reset in 3 steps.";

  try {
    const response = await client.responses.create({
      model: "gpt-5.1-mini",
      input: [
        {
          role: "user",
          content: `
You are an AI discipline coach for Abir, a Muslim CSE student.

Situation:
${modeText}

Respond with:
- A short 1–2 sentence message in second person ("you")
- Then a numbered list of 3 steps he must do right now.
          `.trim(),
        },
      ],
    });

    const text = response.output[0].content[0].text;

    res.json({ message: text });
  } catch (err) {
    console.error("Error from OpenAI:", err.message);
    res.status(500).json({ error: "Failed to generate reset advice." });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
