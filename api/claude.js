// api/claude.js — Claude AI proxy for Admin Dashboard
// Vercel Serverless Function (Node.js runtime)
// Streams Anthropic API responses to the client.
//
// SECURITY: requires ADMIN_API_TOKEN bearer (admin dashboard sends it from
// sessionStorage after login) AND a same-origin/allow-list CORS check, plus
// per-IP rate limiting. Without these, anyone could drain the Anthropic key.

const { applyCors, requireAdminToken, rateLimit } = require('./_security');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

module.exports = async function handler(req, res) {
  if (!applyCors(req, res, 'POST, OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  if (!requireAdminToken(req, res)) return;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in environment variables' });
  }

  try {
    const { messages, system, stream } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const payload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages,
      ...(system && { system }),
      ...(stream && { stream: true })
    };

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      return res.status(anthropicRes.status).json({
        error: 'Anthropic API error',
        status: anthropicRes.status,
        detail: errBody
      });
    }

    if (stream) {
      // Stream SSE events back to client
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = anthropicRes.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } catch (streamErr) {
        console.error('Stream error:', streamErr);
      } finally {
        res.end();
      }
    } else {
      // Non-streaming: return full response
      const data = await anthropicRes.json();
      return res.status(200).json(data);
    }
  } catch (err) {
    console.error('Claude API proxy error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
};
