export async function callWebhook(
  target: string,
  payload: Record<string, unknown>,
  passcode?: string
): Promise<Response> {
  const trimmed = (passcode || '').trim();
  const body = { ...payload };
  if (trimmed) {
    body.passcode = trimmed;
  }
  return fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, payload: body }),
  });
}
