/**
 * Cloudflare Pages Function: POST /api/contact
 *
 * Emails contact-form messages to the owners. The email provider is behind environment variables,
 * so no keys live in the code. See DEPLOY.md, "Contact form email".
 *
 *   RESEND_API_KEY  (secret)  API key from resend.com. If missing, the form returns a friendly
 *                             "please call us" error and nothing is sent.
 *   CONTACT_TO      (var)     Where messages go, e.g. contact@ciscorustdeerplant.com
 *   CONTACT_FROM    (var)     Sender, on a domain verified in Resend,
 *                             e.g. "Rust Deer Plant Website <website@ciscorustdeerplant.com>"
 */

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

// Minimal shape of the Pages Functions context, so this file has no type dependencies.
interface Context {
  request: Request;
  env: Env;
}

const PHONE = '(254) 442-1653';
const MAX = { name: 100, email: 200, phone: 30, topic: 80, message: 4000 };

function reply(request: Request, ok: boolean, status: number, error?: string): Response {
  const wantsJson = (request.headers.get('Accept') ?? '').includes('application/json');
  if (wantsJson) {
    return new Response(JSON.stringify(ok ? { ok: true } : { ok: false, error }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  // Plain HTML form post (no JavaScript): send the visitor back to the contact page.
  const url = new URL('/contact/', request.url);
  url.searchParams.set(ok ? 'sent' : 'error', '1');
  return Response.redirect(url.toString(), 303);
}

const clean = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);

export const onRequestPost = async ({ request, env }: Context): Promise<Response> => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(request, false, 400, 'Something went wrong with the form. Please try again.');
  }

  // Spam checks: hidden honeypot field, and forms submitted faster than a human could type.
  if (clean(form.get('company'), 200)) return reply(request, true, 200);
  const started = Number(form.get('started'));
  if (started && Date.now() - started < 2500) return reply(request, true, 200);

  const name = clean(form.get('name'), MAX.name);
  const email = clean(form.get('email'), MAX.email);
  const phone = clean(form.get('phone'), MAX.phone);
  const topic = clean(form.get('topic'), MAX.topic) || 'General question';
  const message = clean(form.get('message'), MAX.message);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply(request, false, 422, 'Please fill in your name, a valid email and a message.');
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.warn('[contact] Email is not configured. Set RESEND_API_KEY, CONTACT_TO and CONTACT_FROM.');
    return reply(request, false, 503, `Our contact form isn't set up yet. Please call us at ${PHONE}.`);
  }

  const text = [
    `New message from the Rust Deer Plant website`,
    ``,
    `Name:  ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || '(not given)'}`,
    `About: ${topic}`,
    ``,
    message,
    ``,
    `--`,
    `Sent from the contact form at ${new URL(request.url).origin}/contact/`,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: env.CONTACT_TO.split(',').map((s) => s.trim()),
      reply_to: email,
      subject: `Website message: ${topic} (${name})`,
      text,
    }),
  });

  if (!res.ok) {
    console.error('[contact] Resend error', res.status, await res.text().catch(() => ''));
    return reply(request, false, 502, `Sorry, your message could not be sent. Please call us at ${PHONE}.`);
  }
  return reply(request, true, 200);
};
