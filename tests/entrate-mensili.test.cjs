const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the production calculations, with a controllable calendar.
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const computations = script.slice(script.indexOf('/* ===== utils ===== */'), script.indexOf('/* ===== GitHub come database'));
function fixture() {
  let clock = '2026-10-07T12:00:00.000Z';
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock])); }
    static now() { return new Date(clock).getTime(); }
  }
  const ctx = vm.createContext({ Date: ClockDate });
  vm.runInContext(computations + '\nglobalThis.api = { blankState, normalize, anyToState, availableNow, project, pastRows, pendingSaving, recordSaving, syncSavings, savingActual, suggestLoan };', ctx);
  const api = ctx.api;
  const st = api.blankState();
  st.money.available = 10000; st.money.availableAt = '2026-10-07T09:00:00.000Z'; st.money.monthly = 1000;
  st.contracts = [{ id: 'builder', name: 'Impresa', kind: 'impresa', net: 500, vat: 0, payments: [{ id: 'last', planned: { amount: 500, month: '2027-01', offset: null }, actual: null }] }];
  api.normalize(st);
  return { api, st, at(date) { clock = date.includes('T') ? date : date + 'T12:00:00.000Z'; api.normalize(st); } };
}
const row = (f, month) => f.api.project(f.st).rows.find(r => r.month === month);

test('cash stays real while the current month and future months contain expected savings', () => {
  const f = fixture();
  assert.equal(f.api.availableNow(f.st), 10000);
  assert.equal(row(f, '2026-10').bal, 11000);
  assert.equal(row(f, '2027-01').bal, 13500);
});

test('two missed months never become cash or carry forward into the forecast', () => {
  const f = fixture(); f.at('2026-12-01');
  assert.equal(f.api.availableNow(f.st), 10000);
  assert.equal(row(f, '2026-12').inc, 1000);
  assert.equal(row(f, '2027-01').bal, 11500);
  const past = f.api.pastRows(f.st, f.api.project(f.st));
  assert.equal(past.length, 2);
  assert.ok(f.api.pendingSaving(f.st, '2026-10'));
  assert.ok(f.api.pendingSaving(f.st, '2026-11'));
});

test('confirmation replaces the forecast without doubling the money', () => {
  const f = fixture(); f.api.recordSaving(f.st, '2026-10', 1000, '2026-10-07');
  assert.equal(f.api.availableNow(f.st), 11000);
  assert.equal(row(f, '2026-10').inc, 0);
  assert.equal(row(f, '2026-10').bal, 11000);
  assert.equal(row(f, '2027-01').bal, 13500);
});

test('a smaller confirmed amount closes the entire expected entry', () => {
  const f = fixture(); f.api.recordSaving(f.st, '2026-10', 800, '2026-10-07');
  assert.equal(f.api.availableNow(f.st), 10800);
  assert.equal(row(f, '2026-10').bal, 10800);
  assert.equal(f.api.pendingSaving(f.st, '2026-10'), null);
});

test('recording the same monthly entry twice updates one movement', () => {
  const f = fixture(); const first = f.api.recordSaving(f.st, '2026-10', 1000, '2026-10-07');
  const second = f.api.recordSaving(f.st, '2026-10', 900, '2026-10-07');
  assert.equal(first.id, second.id); assert.equal(f.st.extras.length, 1);
  assert.equal(f.api.availableNow(f.st), 10900);
});

test('extra income increases cash without consuming expected monthly savings', () => {
  const f = fixture(); f.st.extras.push({ id: 'gift', amount: 300, label: 'Regalo', date: '2026-10-07', at: '2026-10-07T11:00:00.000Z', savingMonth: null });
  assert.equal(f.api.availableNow(f.st), 10300);
  assert.equal(row(f, '2026-10').bal, 11300);
});

test('late confirmation uses the actual date and only consumes its associated month', () => {
  const f = fixture(); f.at('2026-12-01');
  f.api.recordSaving(f.st, '2026-10', 700, '2026-11-20');
  assert.equal(f.api.availableNow(f.st), 10700);
  assert.equal(f.api.pendingSaving(f.st, '2026-10'), null);
  assert.ok(f.api.pendingSaving(f.st, '2026-11'));
  assert.equal(row(f, '2027-01').bal, 12200);
});

test('confirming an entry already inside the opening balance does not add cash again', () => {
  const f = fixture(); f.st.money.availableAt = '2026-10-07T13:00:00.000Z';
  f.at('2026-10-07T14:00:00.000Z'); f.api.recordSaving(f.st, '2026-10', 1000, '2026-10-06');
  assert.equal(f.api.availableNow(f.st), 10000);
  assert.equal(row(f, '2026-10').inc, 0);
});

test('aligning a real balance preserves the confirmation and excludes movements already included', () => {
  const f = fixture(); f.api.recordSaving(f.st, '2026-10', 1000, '2026-10-07');
  f.st.contracts[0].payments.push({ id: 'paid', planned: null, actual: { amount: 200, date: '2026-10-07', at: '2026-10-07T12:30:00.000Z' } });
  f.at('2026-10-07T13:00:00.000Z'); f.st.money.available = 10800; f.st.money.availableAt = '2026-10-07T13:00:00.000Z';
  assert.equal(f.api.availableNow(f.st), 10800); assert.equal(row(f, '2026-10').inc, 0);
  f.at('2026-11-01'); assert.equal(f.api.availableNow(f.st), 10800);
});

test('correcting or deleting an unaligned income updates cash and restores its forecast', () => {
  const f = fixture(); const e = f.api.recordSaving(f.st, '2026-10', 1000, '2026-10-07');
  e.amount = 750; assert.equal(f.api.availableNow(f.st), 10750);
  f.st.extras = []; assert.equal(f.api.availableNow(f.st), 10000); assert.equal(row(f, '2026-10').bal, 11000);
});

test('monthly amount changes preserve past plans and confirmed amounts', () => {
  const f = fixture(); f.at('2026-11-01'); f.api.recordSaving(f.st, '2026-11', 900, '2026-11-01');
  f.st.money.monthly = 1500; f.api.syncSavings(f.st, true);
  assert.equal(f.st.savings.find(p => p.month === '2026-10').amount, 1000);
  assert.equal(f.st.savings.find(p => p.month === '2026-11').amount, 1000);
  assert.equal(row(f, '2026-12').inc, 1500);
  assert.equal(f.api.availableNow(f.st), 10900);
});

test('zero suspends future expectations and re-enabling does not invent disabled past months', () => {
  const f = fixture(); f.st.money.monthly = 0; f.api.syncSavings(f.st, true);
  assert.equal(row(f, '2026-10').inc, 0);
  f.at('2026-12-01'); f.st.money.monthly = 1000; f.api.syncSavings(f.st, true);
  assert.equal(f.st.savings.find(p => p.month === '2026-11').amount, 0);
  assert.equal(row(f, '2026-12').inc, 1000);
});

test('legacy v3 retains explicit balances and real movements, without fictitious historical entries', () => {
  const f = fixture(); const old = JSON.parse(JSON.stringify(f.st)); old.version = 3;
  delete old.money.monthlySince; delete old.savings; old.money.availableAt = '2026-08-07T09:00:00.000Z';
  old.extras = [{ id: 'real', label: 'Rimborso', amount: 250, date: '2026-09-10', at: '2026-09-10T10:00:00.000Z' }];
  const migrated = f.api.anyToState(old);
  assert.equal(migrated.version, 4); assert.equal(migrated.money.monthlySince, '2026-10');
  assert.equal(f.api.availableNow(migrated), 10250);
  assert.equal(migrated.extras.length, 1); assert.equal(migrated.savings[0].month, '2026-10');
});

test('v4 backup round-trip retains monthly associations and historic expectations', () => {
  const f = fixture(); f.api.recordSaving(f.st, '2026-10', 800, '2026-10-07'); f.at('2026-12-01');
  const imported = f.api.anyToState(JSON.parse(JSON.stringify(f.st)));
  assert.equal(f.api.availableNow(imported), 10800);
  assert.equal(f.api.savingActual(imported, '2026-10').amount, 800);
  assert.ok(f.api.pendingSaving(imported, '2026-11'));
});

test('legacy v1 and v2 backups remain importable', () => {
  const f = fixture();
  const v2 = f.api.anyToState({ version: 2, settings: { cashToday: 10000, cashDate: '2026-10-06' }, incomes: [{ recurring: true, amount: 1000 }], items: [] });
  const v1 = f.api.anyToState({ plan: { initialCash: 10000 }, incomes: [{ recurringMonthly: true, amount: 1000 }], expenses: [] });
  assert.equal(v2.version, 4); assert.equal(v1.version, 4);
  assert.equal(f.api.availableNow(v2), 10000); assert.equal(f.api.availableNow(v1), 10000);
});

test('future-dated imported income is forecast but not available cash', () => {
  const f = fixture(); f.st.extras.push({ id: 'future', label: 'Risparmio', amount: 800, date: '2026-11-20', at: '2026-10-07T12:00:00.000Z', savingMonth: '2026-11' });
  assert.equal(f.api.availableNow(f.st), 10000);
  assert.equal(row(f, '2026-11').inc, 800);
  f.at('2026-11-20'); assert.equal(f.api.availableNow(f.st), 10800); assert.equal(row(f, '2026-11').inc, 0);
});

test('future-dated imported payments stay in the forecast until their date', () => {
  const f = fixture(); f.st.contracts[0].payments[0].actual = { amount: 400, date: '2027-01-20', at: '2026-10-07T12:00:00.000Z' };
  assert.equal(f.api.availableNow(f.st), 10000); assert.equal(row(f, '2027-01').out, 400);
});

test('future actual entry dates cannot be confirmed from the UI model', () => {
  const f = fixture(); assert.equal(f.api.recordSaving(f.st, '2026-10', 1000, '2026-10-20'), null);
  assert.equal(f.st.extras.length, 0);
});

test('overdue payments keep weighing on current liquidity while missed income is excluded', () => {
  const f = fixture(); f.st.contracts[0].payments.push({ id: 'overdue', planned: { amount: 2000, month: '2026-10', offset: null }, actual: null });
  f.at('2026-12-01'); assert.equal(row(f, '2026-12').out, 2000);
  assert.equal(row(f, '2026-12').bal, 9000);
});

test('year rollover has no automatic cash accrual', () => {
  const f = fixture(); f.at('2027-01-01');
  assert.equal(f.api.availableNow(f.st), 10000);
  assert.equal(row(f, '2027-01').bal, 10500);
});
