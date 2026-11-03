const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const computations = script.slice(script.indexOf('/* ===== utils ===== */'), script.indexOf('/* ===== GitHub come database'));
const ctx = vm.createContext({});
vm.runInContext(computations + '\nglobalThis.api = { blankState, normalize, contractTotal, contractStats, itemStats, anyToState };', ctx);
const { blankState, normalize, contractTotal, contractStats, itemStats, anyToState } = ctx.api;
const planned = (id, amount, itemId = null) => ({
  id, itemId, note: id,
  planned: { amount, month: '2027-01', offset: null }, actual: null,
});

test('legacy contracts keep their total and payments after normalization', () => {
  const st = blankState();
  st.contracts = [{ id: 'old', name: 'Doccia', kind: 'altro', net: 620, vat: 22,
    payments: [planned('wall', 250), planned('tray', 250), planned('column', 256)] }];
  normalize(st);
  assert.equal(contractTotal(st.contracts[0]), 756.4);
  assert.equal(st.contracts[0].payments.length, 3);
  assert.equal(st.contracts[0].items.length, 0);
  assert.equal(contractStats(st.contracts[0]).pending, 756);
});

test('itemized total is the sum of item amounts, regardless of legacy net and VAT', () => {
  const st = blankState();
  st.contracts = [{
    id: 'bath', name: 'Bagno', kind: 'fornitore', net: 999, vat: 22,
    items: [{ id: 'wall', name: 'Rivestimenti', amount: 825 }, { id: 'tray', name: 'Piatto', amount: 250 }],
    payments: [planned('payment-wall', 825, 'wall'), planned('payment-tray', 250, 'tray')],
  }];
  normalize(st);
  const c = st.contracts[0];
  assert.equal(contractTotal(c), 1075);
  assert.equal(contractStats(c).pending, 1075);
  assert.equal(itemStats(c, c.items[0]).remaining, 825);
  assert.equal(itemStats(c, c.items[1]).unscheduled, 0);
  assert.equal(contractStats(c).unscheduled, 0);
});

test('paid installments belong to their own item and do not change global cash logic', () => {
  const st = blankState();
  st.contracts = [{
    id: 'bath', name: 'Bagno', kind: 'fornitore', net: 0, vat: 0,
    items: [{ id: 'wall', name: 'Rivestimenti', amount: 500 }, { id: 'tap', name: 'Rubinetteria', amount: 200 }],
    payments: [
      { ...planned('wall-pay', 500, 'wall'), actual: { amount: 500, date: '2026-10-01', at: '2026-10-01T12:00:00.000Z' } },
      planned('tap-pay', 200, 'tap'),
    ],
  }];
  normalize(st);
  const c = st.contracts[0];
  assert.equal(itemStats(c, c.items[0]).remaining, 0);
  assert.equal(itemStats(c, c.items[1]).remaining, 200);
  assert.equal(contractStats(c).paid, 500);
  assert.equal(contractStats(c).remaining, 200);
});

test('invalid item references become unassigned without deleting payments', () => {
  const st = blankState();
  st.contracts = [{
    id: 'bath', name: 'Bagno', kind: 'altro', net: 0, vat: 0,
    items: [{ id: 'only', name: 'Piatto', amount: 250 }],
    payments: [planned('orphan', 250, 'deleted-item')],
  }];
  normalize(st);
  assert.equal(st.contracts[0].payments.length, 1);
  assert.equal(st.contracts[0].payments[0].itemId, null);
});

test('historical backup imports preserve both old and itemized contracts', () => {
  const st = blankState();
  st.contracts = [
    { id: 'old', name: 'Impresa', kind: 'impresa', net: 1000, vat: 10, payments: [planned('a', 1100)] },
    { id: 'new', name: 'Bagno', kind: 'altro', net: 0, vat: 0, items: [{ id: 'a', name: 'Specchio', amount: 250 }], payments: [planned('b', 250, 'a')] },
  ];
  const imported = anyToState(JSON.parse(JSON.stringify(st)));
  assert.equal(contractTotal(imported.contracts[0]), 1100);
  assert.equal(contractTotal(imported.contracts[1]), 250);
  assert.equal(imported.contracts[1].payments[0].itemId, 'a');
});
