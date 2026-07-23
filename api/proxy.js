export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed', message: 'Only POST and OPTIONS are supported.' });
  }

  const { target, payload } = req.body || {};

  if (!target) {
    return res.status(400).json({ error: 'missing_target', message: 'A target webhook URL is required.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(target);
  } catch {
    return res.status(400).json({ error: 'invalid_target', message: 'Target must be a valid HTTP(S) URL.' });
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return res.status(400).json({ error: 'invalid_target', message: 'Target must be a valid HTTP(S) URL.' });
  }

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      body: JSON.stringify(payload || {}),
    });

    const body = await upstream.text();

    const upstreamCT = upstream.headers.get('content-type');
    if (upstreamCT) {
      res.setHeader('Content-Type', upstreamCT);
    }

    return res.status(upstream.status).send(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown connection error';
    return res.status(502).json({
      error: 'proxy_connection_error',
      message,
      hint: 'Check the webhook URL and confirm the n8n workflow is active.',
    });
  }
}

export const config = {
  maxDuration: 300,
};
