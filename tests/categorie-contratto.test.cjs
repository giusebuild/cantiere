const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const computations = script.slice(script.indexOf('/* ===== utils ===== */'), script.indexOf('/* ===== GitHub come database'));
const ctx = vm.createContext({});
vm.runInContext(computations + '\nglobalThis.api = { blankState, normalize, anyToState, contractTotal, contractStats, itemStats, itemGroups };', ctx);
const { blankState, normalize, anyToState, contractTotal, contractStats, itemGroups } = ctx.api;
const pay = (id, amount, itemId = null) => ({
  id, itemId, note: id,
  planned: { amount, month: '2027-01', offset: null }, actual: null
});

test('categories are optional and never change legacy contracts', () => {
  const state = blankState();
  state.contracts = [{ id:'impresa', name:'Impresa', kind:'impresa', net:1000, vat:10, payments:[pay('sal',1100)] }];
  normalize(state);
  assert.equal(contractTotal(state.contracts[0]), 1100);
  assert.equal(state.contracts[0].items.length, 0);
  assert.equal(state.contracts[0].payments[0].id, 'sal');
});

test('a category sums only its products and never double-counts the contract', () => {
  const state = blankState();
  state.contracts = [{
    id: 'bath', name: 'Bagno', kind: 'altro', net:4000, vat:22,
    items: [
      { id:'tray',name:'Piatto doccia',category:'Doccia',vendor:'Fornitore A',amount:250 },
      { id:'column',name:'Colonna',category:'Doccia',vendor:'Fornitore B',amount:300 },
      { id:'wall',name:'Rivestimento',category:'Rivestimenti',amount:700 },
    ],
    payments:[pay('order',550),pay('tiles',700)]
  }];
  normalize(state);
  const c = state.contracts[0], groups = itemGroups(c);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].name, 'Doccia');
  assert.equal(groups[0].total, 550);
  assert.equal(groups[1].total, 700);
  assert.equal(contractTotal(c), 1250);
  assert.equal(contractStats(c).cost, 1250);
  assert.equal(contractStats(c).remaining, 1250);
  assert.equal(c.items[0].vendor, 'Fornitore A');
});

test('historic and unassigned payments survive detailed category edits', () => {
  const state = blankState();
  state.contracts = [{
    id:'bath',name:'Bagno',kind:'altro',net:0,vat:0,
    items:[{id:'tray',name:'Piatto',category:'Doccia',amount:250}],
    payments:[pay('legacy',250)]
  }];
  normalize(state);
  assert.equal(state.contracts[0].payments.length, 1);
  assert.equal(state.contracts[0].payments[0].itemId, null);
  assert.equal(contractStats(state.contracts[0]).pending, 250);
});

test('backup round-trip preserves category, vendor, identifiers and payments', () => {
  const state=blankState();
  state.contracts=[
    {id:'legacy',name:'Architetto',kind:'professionista',net:1000,vat:4,payments:[pay('fee',1040)]},
    {id:'bath',name:'Bagno',kind:'altro',net:0,vat:0,
      items:[{id:'a',name:'Rubinetteria',category:'Miscelatori',vendor:'Negozio',amount:200}],
      payments:[pay('tap-pay',200,'a')]}
  ];
  const saved=anyToState(JSON.parse(JSON.stringify(state)));
  assert.equal(contractTotal(saved.contracts[0]),1040);
  assert.equal(contractTotal(saved.contracts[1]),200);
  assert.equal(saved.contracts[1].items[0].category,'Miscelatori');
  assert.equal(saved.contracts[1].items[0].vendor,'Negozio');
  assert.equal(saved.contracts[1].payments[0].itemId,'a');
});
