import { describe, it, expect, afterEach } from 'vitest';
import { createRequire } from 'module';
import { createHandler, buildApprovalEmail } from './approval.js';

const require = createRequire(import.meta.url);
const { SMTPServer } = require('smtp-server');

const PID = '11111111-1111-1111-1111-111111111111';
const BASE = 'https://proj.supabase.co';

// ---- a tiny stand-in for Supabase (auth + the few REST calls the handler makes) -------------------------
function fakeSupabase(profiles) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url);
    const token = (init.headers?.Authorization || '').replace('Bearer ', '');
    const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
    calls.push(`${init.method || 'GET'} ${u.pathname}${u.search}`);
    if (u.pathname === '/auth/v1/user') return token === 'cap' || token === 'user' ? json(200, { id: token }) : json(401, {});
    if (u.pathname === '/rest/v1/rpc/is_captain') return json(200, token === 'cap');
    if (u.pathname === '/rest/v1/profiles') {
      const id = u.searchParams.get('id').replace('eq.', '');
      const row = profiles[id];
      if (!init.method || init.method === 'GET') return json(200, row ? [row] : []);
      if (init.method === 'PATCH') {
        if (!row) return json(200, []);
        if (u.searchParams.get('approval_emailed_at') === 'is.null' && row.approval_emailed_at) return json(200, []);
        Object.assign(row, JSON.parse(init.body));
        return json(200, [row]);
      }
    }
    return json(404, {});
  };
  return { fetchImpl, calls };
}

const makeRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  return r;
};
const call = async (handler, { method = 'POST', token = 'cap', body = { participantId: PID } } = {}) => {
  const res = makeRes();
  await handler({ method, headers: token ? { authorization: `Bearer ${token}` } : {}, body }, res);
  return res;
};
const approved = (over = {}) => ({ id: PID, name: 'Jordan T.', email: 'jordan@example.org', team_name: 'Phoenix', role: 'participant', status: 'approved', approval_emailed_at: null, ...over });

let server;
afterEach(async () => { if (server) await new Promise((r) => server.close(r)); server = null; });

async function startSmtp() {
  const received = [];
  server = new SMTPServer({
    authOptional: true, allowInsecureAuth: true, disabledCommands: ['STARTTLS'],
    onAuth: (a, s, cb) => cb(null, { user: a.username }),
    onData(stream, session, cb) {
      let raw = ''; stream.on('data', (c) => { raw += c.toString(); });
      stream.on('end', () => { received.push({ to: session.envelope.rcptTo.map((r) => r.address), raw }); cb(); });
    },
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { received, port: server.server.address().port };
}
const envFor = (port) => ({
  VITE_SUPABASE_URL: BASE, VITE_SUPABASE_ANON_KEY: 'anon', SMTP_HOST: '127.0.0.1', SMTP_PORT: String(port),
  SMTP_USER: 'notifications@example.org', SMTP_PASS: 'pw', SMTP_INSECURE: '1', SITE_URL: 'https://league.example.org',
});

describe('approval email: who is allowed', () => {
  it('only accepts POST', async () => {
    const { fetchImpl } = fakeSupabase({});
    const r = await call(createHandler({ env: envFor(1), fetchImpl }), { method: 'GET' });
    expect(r.code).toBe(405);
  });
  it('rejects a missing, invalid or non-facilitator token', async () => {
    const { fetchImpl } = fakeSupabase({ [PID]: approved() });
    const h = createHandler({ env: envFor(1), fetchImpl });
    expect((await call(h, { token: null })).code).toBe(401);
    expect((await call(h, { token: 'garbage' })).code).toBe(401);
    expect((await call(h, { token: 'user' })).code).toBe(403); // signed in, but not a facilitator
  });
  it('rejects bad ids and unknown people', async () => {
    const { fetchImpl } = fakeSupabase({});
    const h = createHandler({ env: envFor(1), fetchImpl });
    expect((await call(h, { body: { participantId: "x' or 1=1" } })).code).toBe(400);
    expect((await call(h, { body: {} })).code).toBe(400);
    expect((await call(h, {})).code).toBe(404);
  });
  it('refuses people who are not approved (cannot be used to email arbitrary addresses)', async () => {
    const { fetchImpl } = fakeSupabase({ [PID]: approved({ status: 'pending' }) });
    const r = await call(createHandler({ env: envFor(1), fetchImpl }));
    expect(r.code).toBe(409);
  });
  it('explains a missing database column instead of claiming the person does not exist', async () => {
    const { fetchImpl } = fakeSupabase({ [PID]: approved() });
    const brokenDb = async (url, init) => (String(url).includes('/rest/v1/profiles') ? { ok: false, status: 400, json: async () => ({}) } : fetchImpl(url, init));
    const r = await call(createHandler({ env: envFor(1), fetchImpl: brokenDb }));
    expect(r.code).toBe(500);
    expect(r.body.error).toMatch(/database script/i);
  });
  it('says so, rather than failing, when the server has no mail settings', async () => {
    const { fetchImpl } = fakeSupabase({ [PID]: approved() });
    const env = { ...envFor(1), SMTP_PASS: '' };
    expect((await call(createHandler({ env, fetchImpl }))).code).toBe(503);
  });
});

describe('approval email: sending', () => {
  it('sends one email to the stored address, then never again', async () => {
    const { received, port } = await startSmtp();
    const profiles = { [PID]: approved() };
    const { fetchImpl } = fakeSupabase(profiles);
    const h = createHandler({ env: envFor(port), fetchImpl });

    const first = await call(h);
    expect(first.code).toBe(200);
    expect(received).toHaveLength(1);
    expect(received[0].to).toEqual(['jordan@example.org']);
    expect(received[0].raw).toMatch(/Subject: You're approved/i);
    expect(received[0].raw).toContain('Hi Jordan');
    expect(received[0].raw).toContain('Team Phoenix');
    expect(received[0].raw).toContain('https://league.example.org');
    expect(profiles[PID].approval_emailed_at).toBeTruthy();

    const again = await call(h); // e.g. a double-click
    expect(again.code).toBe(200);
    expect(again.body.alreadySent).toBe(true);
    expect(received).toHaveLength(1);
  });

  it('two simultaneous requests still send only one email', async () => {
    const { received, port } = await startSmtp();
    const { fetchImpl } = fakeSupabase({ [PID]: approved() });
    const h = createHandler({ env: envFor(port), fetchImpl });
    await Promise.all([call(h), call(h)]);
    expect(received).toHaveLength(1);
  });

  it('releases the claim when sending fails, so it can be retried', async () => {
    const profiles = { [PID]: approved() };
    const { fetchImpl } = fakeSupabase(profiles);
    const failing = createHandler({ env: envFor(1), fetchImpl, makeTransport: () => ({ sendMail: async () => { throw new Error('smtp down'); } }) });
    const r = await call(failing);
    expect(r.code).toBe(502);
    expect(r.body.error).not.toMatch(/smtp down/); // internals are not leaked
    expect(profiles[PID].approval_emailed_at).toBeNull();

    const { received, port } = await startSmtp();
    const ok = await call(createHandler({ env: envFor(port), fetchImpl }));
    expect(ok.code).toBe(200);
    expect(received).toHaveLength(1);
  });
});

describe('buildApprovalEmail', () => {
  it('escapes HTML in names and leaves out the team when there is none', () => {
    const m = buildApprovalEmail({ name: '<b>Sam</b> Q', teamName: null, siteUrl: 'https://x.org' });
    expect(m.html).not.toContain('<b>Sam</b>');
    expect(m.html).toContain('&lt;b&gt;Sam&lt;/b&gt;');
    expect(m.text).not.toContain('for Team');
    expect(m.text).toContain('https://x.org/video.html');
  });
});
