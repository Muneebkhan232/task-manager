const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PRIORITIES = ['low', 'medium', 'high'];

const SYSTEM_PROMPT = `You are a project planning assistant. Given a task description, respond with ONLY a JSON object, no markdown, in exactly this shape:
{"summary": string (one short sentence), "priority": "low" | "medium" | "high", "estimatedHours": number, "steps": string[] (3-8 short, actionable steps)}`;

// Validate and normalise whatever the model returned
const validatePlan = (plan) => {
  if (!plan || typeof plan !== 'object') return null;
  const priority = String(plan.priority || '').toLowerCase();
  const hours = Number(plan.estimatedHours);
  if (typeof plan.summary !== 'string' || !plan.summary.trim()) return null;
  if (!PRIORITIES.includes(priority)) return null;
  if (!Number.isFinite(hours) || hours <= 0) return null;
  if (!Array.isArray(plan.steps) || plan.steps.length === 0) return null;
  if (!plan.steps.every((s) => typeof s === 'string' && s.trim())) return null;
  return { summary: plan.summary.trim(), priority, estimatedHours: hours, steps: plan.steps.map((s) => s.trim()) };
};

exports.planTask = async (req, res) => {
  const description = req.body && req.body.description;

  if (typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ success: false, message: 'A non-empty description is required' });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ success: false, message: 'AI service is not configured' });
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: description.trim() },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
      return res.status(502).json({ success: false, message: 'AI service request failed' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(502).json({ success: false, message: 'AI returned an invalid response' });
    }

    const plan = validatePlan(parsed);
    if (!plan) {
      return res.status(502).json({ success: false, message: 'AI response was missing required fields' });
    }

    res.status(200).json({ success: true, plan });
  } catch (err) {
    console.error('AI call failed:', err.message);
    res.status(502).json({ success: false, message: 'Could not reach the AI service' });
  }
};
