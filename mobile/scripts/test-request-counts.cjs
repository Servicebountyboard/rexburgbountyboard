/* Offline store tests: actual TypeScript executed in a network-isolated VM.
 * This small hook harness tests store actions, not React rendering/effect timing.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const baselinePath = path.join(root, 'tests/request-counts/baseline.json');
const stamp = '2026-01-01T00:00:00Z';
const clone = (value) => JSON.parse(JSON.stringify(value));

function fixture() {
  return {
    profiles: [{ user_id: 'hunter', username: 'Hunter', biography: '', total_points: 0, average_rating: 0 }],
    bounties: [{ bounty_id: 1, poster_id: 'poster', bounty_status_id: 4, title: 'Garden', description: 'Weed beds', materials: 'Gloves', estimated_minutes: 60, reward_points: 200, created_at: stamp }],
    bounty_status: [{ bounty_status_id: 4, status_name: 'IN_PROGRESS' }],
    bounty_claims: [{ bounty_claim_id: 1, bounty_id: 1, hunter_id: 'hunter', bounty_claim_status_id: 4 }],
    bounty_claim_status: [{ bounty_claim_status_id: 4, status_name: 'ASSIGNED' }],
    notifications: [{ notification_id: 1, user_id: 'hunter', bounty_id: 1, title: 'Accepted', message: 'Welcome', is_read: false, created_at: stamp }],
    bounty_messages: [{ message_id: 1, bounty_id: 1, sender_id: 'poster', message_text: 'Welcome', created_at: stamp }],
    user_ratings: [], reward_transactions: [], bounty_submissions: [],
  };
}

async function harness() {
  const db = fixture(), calls = [], slots = [], effects = [];
  let cursor = 0, mounted = false, failRpc = false, failRead = false;
  const record = (kind, name, data, error, args) => {
    calls.push({ kind, name, args, rows: Array.isArray(data) ? data.length : 0,
      fixtureBytes: Buffer.byteLength(JSON.stringify(data)) });
    return { data, error };
  };
  const client = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'hunter' } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from(table) {
      assert.ok(Object.hasOwn(db, table), `Unknown fixture table: ${table}`);
      let columns, limit;
      const ordering = [], filters = [];
      const query = {
        select(value) { columns = value; return query; },
        eq(column, value) { filters.push([column, value]); return query; },
        order(column, options) { ordering.push([column, options]); return query; },
        limit(value) { limit = value; return query; },
        then(resolve, reject) {
          let rows = clone(db[table]);
          rows = rows.filter(row => filters.every(([key, value]) => row[key] === value));
          rows.sort((a,b) => { for (const [key, opts] of ordering) { const diff = (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (opts.ascending ? 1 : -1); if (diff) return diff; } return 0; });
          if (limit !== undefined) rows = rows.slice(0, limit);
          if (columns !== '*') rows = rows.map(row => Object.fromEntries(columns.split(',').map(key => [key, row[key]])));
          const error = failRead && table === 'bounty_messages' ? { message: 'Read failed' } : null;
          return Promise.resolve(record('read', table, error ? null : rows, error)).then(resolve, reject);
        },
      };
      return query;
    },
    async rpc(name, args) {
      assert.ok(['send_bounty_message', 'mark_notification_read'].includes(name), `Unexpected RPC: ${name}`);
      if (failRpc) return record('rpc', name, null, { message: 'RPC failed' }, args);
      if (name === 'send_bounty_message') {
        assert.equal(args.p_bounty_id, 1);
        db.bounty_messages.push({ message_id: Math.max(...db.bounty_messages.map(m => m.message_id)) + 1, bounty_id: 1, sender_id: 'hunter', message_text: args.p_text, created_at: stamp });
      } else {
        assert.equal(args.p_notification_id, 1);
        db.notifications[0].is_read = true;
      }
      return record('rpc', name, null, null, args);
    },
  };
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useCallback: callback => callback,
    useEffect: callback => { if (!mounted) effects.push(callback); },
    useContext: () => { throw new Error('Consumer rendering not supported'); },
    createElement: (type, props) => ({ type, props }),
  };
  const cache = {};
  function load(relative) {
    if (cache[relative]) return cache[relative];
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
    const module = { exports: {} };
    const sandbox = { module, exports: module.exports, setTimeout: callback => { queueMicrotask(callback); },
      fetch: () => { throw new Error('Network forbidden in tests'); },
      require(name) {
        if (name === 'react') return react;
        if (name === '@/lib/supabase') return { supabase: client };
        if (name === './live-model') return load('src/features/tavern/live-model.ts');
        throw new Error(`Unmocked import forbidden: ${name}`);
      },
    };
    vm.runInNewContext(js, sandbox, { filename: relative, timeout: 5000 });
    return cache[relative] = module.exports;
  }
  const { TavernProvider } = load('src/features/tavern/live-store.tsx');
  const render = () => { cursor = 0; return TavernProvider({ children: null }).props.value; };
  render(); mounted = true;
  effects.forEach(effect => effect());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(render().ready, true);
  assert.equal(render().state.messages.length, 1);
  calls.length = 0; // Exclude startup/authentication from each isolated action.
  return { db, calls, render, failRpc: () => { failRpc = true; }, failRead: () => { failRead = true; } };
}

const scenarios = [
  { id: 'send-message', label: 'Send a message', run: h => h.render().act({ type: 'message', bountyId: '1', text: 'Hello' }), verify(h) {
    assert.equal(h.db.bounty_messages.filter(m => m.message_text === 'Hello').length, 1);
    assert.equal(h.render().state.messages.filter(m => m.text === 'Hello').length, 1);
    assert.equal(h.calls.filter(c => c.name === 'send_bounty_message').length, 1);
  } },
  { id: 'open-notification', label: 'Open a notification (mark-read handler)', run: h => h.render().act({ type: 'read', id: '1' }), verify(h) {
    assert.equal(h.render().state.notices[0].read, true);
    assert.equal(h.calls.filter(c => c.name === 'mark_notification_read').length, 1);
  } },
  { id: 'refresh-messages', label: 'Refresh messages', prepare(h) {
    h.db.bounty_messages.push({ message_id: 2, bounty_id: 1, sender_id: 'poster', message_text: 'New reply', created_at: stamp });
  }, run: h => h.render().refresh(), verify(h) {
    assert.equal(h.render().state.messages.filter(m => m.text === 'New reply').length, 1);
    assert.equal(h.calls.filter(c => c.kind === 'rpc').length, 0);
  } },
];

async function main() {
  const baseline = fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')) : null;
  const capture = process.argv.includes('--capture-baseline');
  if (capture && baseline) throw new Error('Baseline already exists; it will not be silently overwritten.');
  if (!capture && !baseline) throw new Error('Missing baseline. Run once with --capture-baseline.');
  const results = [];
  for (const scenario of scenarios) {
    const h = await harness();
    scenario.prepare?.(h);
    assert.equal(await scenario.run(h), true);
    scenario.verify(h);
    assert.equal(h.render().busy, false);
    assert.equal(h.render().state.error, null);
    assert.equal(h.render().state.bounties[0].title, 'Garden');
    results.push({ id: scenario.id, action: scenario.label, requests: h.calls.length,
      reads: h.calls.filter(c => c.kind === 'read').length,
      fixtureBytes: h.calls.reduce((sum, c) => sum + c.fixtureBytes, 0),
      byEndpoint: h.calls.reduce((counts, c) => { counts[c.name] = (counts[c.name] || 0) + 1; return counts; }, {}), behavior: 'PASS' });
  }
  // Failure paths must preserve visible data and return failure.
  for (const scenario of scenarios) {
    const h = await harness();
    if (scenario.id === 'refresh-messages') h.failRead(); else h.failRpc();
    assert.equal(await scenario.run(h), false);
    assert.equal(h.render().state.messages.length, 1);
    assert.equal(h.render().state.notices[0].read, false);
    assert.ok(h.render().state.error);
    assert.equal(h.render().busy, false);
    if (scenario.id !== 'refresh-messages') assert.equal(h.calls.length, 1);
  }
  // Already-read notification clicks are measured separately, not hidden.
  // Large conversation: the latest page is scoped, capped, ordered and merged.
  const large = await harness();
  for (let id = 2; id <= 70; id++) large.db.bounty_messages.push({ message_id: id, bounty_id: 1, sender_id: 'poster', message_text: `Message ${id}`, created_at: stamp });
  large.db.bounty_messages.push({ message_id: 71, bounty_id: 2, sender_id: 'poster', message_text: 'Other conversation', created_at: stamp });
  await large.render().refresh(); // Preload history and another conversation.
  large.calls.length = 0;
  assert.equal(await large.render().act({ type: 'message', bountyId: '1', text: 'Newest' }), true);
  assert.equal(large.calls.length, 2);
  assert.equal(large.calls[1].rows, 50);
  assert.equal(large.render().state.messages.length, 72);
  assert.equal(large.render().state.messages.at(-1).text, 'Newest');
  assert.equal(large.render().state.messages.filter(m => m.text === 'Other conversation').length, 1);
  assert.equal(large.render().state.messages.filter(m => m.id === '1').length, 1);
  // An unknown message from another conversation must not leak into this refresh.
  large.db.bounty_messages.push({ message_id: 73, bounty_id: 2, sender_id: 'poster', message_text: 'Not fetched', created_at: stamp });
  await large.render().act({ type: 'message', bountyId: '1', text: 'Another' });
  assert.equal(large.render().state.messages.some(m => m.text === 'Not fetched'), false);
  const saved = await harness();
  saved.failRead();
  assert.equal(await saved.render().act({ type: 'message', bountyId: '1', text: 'Saved once' }), true);
  assert.equal(saved.db.bounty_messages.filter(m => m.message_text === 'Saved once').length, 1);
  assert.match(saved.render().state.error, /was sent/);
  assert.equal(saved.render().busy, false);
  assert.equal(saved.render().state.messages.length, 1);
  const read = await harness();
  read.db.notifications[0].is_read = true;
  await read.render().refresh(); read.calls.length = 0;
  assert.equal(await read.render().act({ type: 'read', id: '1' }), true);
  assert.equal(read.render().state.notices[0].read, true);
  const reportDir = path.join(root, 'tests/request-counts');
  fs.mkdirSync(reportDir, { recursive: true });
  if (capture) fs.writeFileSync(baselinePath, JSON.stringify({ results }, null, 2) + '\n');
  const original = baseline || { results };
  let regression = false;
  const rows = results.map(row => {
    const before = original.results.find(item => item.id === row.id);
    assert.ok(before, `No baseline for ${row.id}`);
    if (row.requests > before.requests) regression = true;
    return `| ${row.action} | ${before.requests} | ${row.requests} | ${((1 - row.requests / before.requests) * 100).toFixed(1)}% | ${row.fixtureBytes} | ${row.behavior} |`;
  });
  const report = '# Offline request-count comparison\n\n'
    + 'Actual store functions with mocked Supabase responses. Startup excluded. Payload bytes are JSON fixture data only, not billed egress. Notification navigation/address lookup, React lifecycle, RLS and server SQL are not tested.\n\n'
    + '| Action | Baseline requests | Current requests | Reduction | Fixture response bytes | Store behavior |\n|---|---:|---:|---:|---:|---|\n' + rows.join('\n')
    + `\n\nThree success checks, three failure checks, an already-read notification check, large-conversation filtering/merge checks, and a saved-message/read-failure check passed. Already-read click: ${read.calls.length} requests.\n\n`
    + '## Requests by endpoint\n\n| Endpoint | Send message | Open notification | Refresh messages |\n|---|---:|---:|---:|\n'
    + [...new Set(results.flatMap(row => Object.keys(row.byEndpoint)))].sort().map(name => `| ${name} | ${results.map(row => row.byEndpoint[name] || 0).join(' | ')} |`).join('\n') + '\n';
  fs.writeFileSync(path.join(reportDir, 'latest.json'), JSON.stringify({ results, requestRegression: regression }, null, 2) + '\n');
  fs.writeFileSync(path.join(reportDir, 'comparison.md'), report);
  console.log(report);
  if (regression) throw new Error('Request-count regression: current exceeds fixed baseline.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
