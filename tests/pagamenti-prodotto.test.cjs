const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const computations = script.slice(script.indexOf('/* ===== utils ===== */'), script.indexOf('/* ===== GitHub come database'));
const ctx = vm.createContext({});
vm.runInContext(computations + '\nglobalThis.api = { prepareItemPayments, contractStats, normalize, blankState };', ctx);
const { prepareItemPayments, contractStats, normalize, blankState } = ctx.api;
const product = (id, amount) => ({ id, name: id, category: 'Doccia', amount });
const installment = (id, amount, month = '2027-01', itemId = null, actual = null) =>
  ({ id, note: id, itemId, planned: { amount, month, offset: null }, actual });
const plannedTotal = c => c.payments.reduce((t, p) => t + (p.planned ? p.planned.amount : 0), 0);

test('prepares one editable payment per product when none is scheduled', () => {
  const c = { id: 'bath', items: [product('tray', 250), product('column', 300)], payments: [] };
  const result = prepareItemPayments(c, '2027-01');
  assert.equal(result.ok, true);
  assert.equal(c.payments.length, 2);
  assert.equal(plannedTotal(c), 550);
  assert.deepEqual(Array.from(c.payments.map(p => p.itemId)), ['tray', 'column']);
  assert.ok(c.payments.every(p => p.planned.month === '2027-01'));
});

test('existing unpaid monthly plans are split by product without changing monthly totals', () => {
  const c = {
    id: 'bath',
    items: [product('wall', 450), product('tiles', 250), product('tray', 250)],
    payments: [installment('a', 400, '2027-01'), installment('b', 550, '2027-02')]
  };
  const original = c.payments.map(p => [p.planned.month, p.planned.amount]);
  const r = prepareItemPayments(c, '2027-01');
  assert.equal(r.ok, true);
  assert.equal(plannedTotal(c), 950);
  assert.ok(c.payments.every(p => p.itemId));
  for (const [month, amount] of original)
    assert.equal(c.payments.filter(p => p.planned.month === month).reduce((t, p) => t + p.planned.amount, 0), amount);
  const again = prepareItemPayments(c, '2027-01');
  assert.equal(again.ok, false);
  assert.equal(plannedTotal(c), 950);
});

test('already linked product payments are preserved and only the gap is created', () => {
  const c = {
    id: 'bath', items: [product('wall', 450), product('tray', 250)],
    payments: [installment('already', 450, '2027-01', 'wall')]
  };
  const r = prepareItemPayments(c, '2027-02');
  assert.equal(r.ok, true);
  assert.equal(c.payments.length, 2);
  assert.equal(c.payments[0].id, 'already');
  assert.equal(c.payments[1].itemId, 'tray');
  assert.equal(c.payments[1].planned.month, '2027-02');
  assert.equal(plannedTotal(c), 700);
});

test('paid unassigned entries are never split or silently reassigned', () => {
  const c = { id:'bath', items:[product('tray',250)], payments:[
    installment('paid',250,'2026-10',null,{amount:250,date:'2026-10-10',at:'2026-10-10T12:00:00.000Z'})
  ] };
  const original=JSON.stringify(c);
  assert.equal(prepareItemPayments(c,'2027-01').ok,false);
  assert.equal(JSON.stringify(c), original);
});

test('mismatched generic installments are left intact, not duplicated', () => {
  const c = { id:'bath', items:[product('tray',250)], payments:[installment('existing',300)] };
  const original=JSON.stringify(c);
  assert.equal(prepareItemPayments(c,'2027-01').ok,false);
  assert.equal(JSON.stringify(c),original);
});

test('existing simple contracts remain unchanged', () => {
  const c={id:'builder',name:'Impresa',kind:'impresa',net:1000,vat:10,items:[],payments:[installment('sal',1100)]};
  const original=JSON.stringify(c);
  assert.equal(prepareItemPayments(c,'2027-01').ok,false);
  assert.equal(JSON.stringify(c),original);
});

test('existing contract financial calculations continue to use scheduled amounts', () => {
  const state=blankState(); state.contracts=[{
    id:'bath',name:'Bagno',kind:'fornitore',net:0,vat:0,
    items:[product('tray',250),product('column',300)],
    payments:[installment('generic',550,'2027-01')]
  }];
  normalize(state);
  const c=state.contracts[0], before=contractStats(c);
  const r=prepareItemPayments(c,'2027-01');
  const after=contractStats(c);
  assert.equal(r.ok,true);
  assert.equal(before.cost,after.cost);
  assert.equal(before.paid,after.paid);
  assert.equal(before.remaining,after.remaining);
  assert.equal(before.pending,after.pending);
  assert.equal(before.unscheduled,after.unscheduled);
});
