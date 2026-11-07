const test = require('node:test');
const assert = require('node:assert/strict');
const { createPulse, orderToItem, methodOf } = require('../business-pulse');

function memory() {
  const d = {};
  return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, d };
}
const quiet = { warn() {} };
const order = {
  orderID: 'ORD-1-ABC',
  name: 'Ama Owusu',
  email: 'ama@example.com',
  shippingAddress: '12 Secret Street, Kumasi',
  mobileNumber: '0240000000',
  items: [{ name: 'Classic Tee', price: '$30.00', quantity: 2, size: 'M' }, { name: 'Cap', price: '$15.00', quantity: 1, size: 'One Size' }],
  subtotal: 75, shipping: 5.99, tax: 6, discountAmount: 7.5, discountCode: 'LUCI10', total: 79.49,
  paymentMethod: 'Card', paymentReference: 'PSK-9', status: 'Confirmed',
};

test('an order becomes a sale with a stable eventId and no address or phone', () => {
  const item = orderToItem(order, 'usd');
  assert.equal(item.direction, 'sale');
  assert.equal(item.amount, 79.49);
  assert.equal(item.eventId, 'ORD-1-ABC');
  assert.equal(item.reference, 'ORD-1-ABC');
  assert.equal(item.method, 'card');
  assert.equal(item.customer, 'Ama Owusu');
  assert.match(item.notes, /2 x Classic Tee \(M\), 1 x Cap/);
  assert.match(item.notes, /Amounts in USD/);
  assert.match(item.notes, /Payment ref PSK-9/);
  const json = JSON.stringify(item);
  assert.ok(!json.includes('Secret Street'));
  assert.ok(!json.includes('0240000000'));
});

test('payment methods map to tracker methods', () => {
  assert.equal(methodOf('MTN Mobile Money'), 'momo');
  assert.equal(methodOf('Cash on Delivery'), 'cash');
  assert.equal(methodOf('Card'), 'card');
  assert.equal(methodOf('???'), 'other');
});

test('does nothing when not configured, and refuses the private key', async () => {
  let calls = 0;
  const f = async () => { calls += 1; return { ok: true, status: 201 }; };
  const off = createPulse({ url: '', key: '', fetch: f, storage: memory(), logger: quiet });
  await off.trackOrder(order);
  const priv = createPulse({ url: 'https://t.example/api/ingest', key: 'bp_secret', fetch: f, storage: memory(), logger: quiet });
  await priv.trackOrder(order);
  assert.equal(off.enabled, false);
  assert.equal(priv.enabled, false);
  assert.equal(calls, 0);
});

test('sends with the store key and empties the queue', async () => {
  const sent = [];
  const f = async (url, opts) => { sent.push({ url, opts }); return { ok: true, status: 201 }; };
  const s = memory();
  const p = createPulse({ url: 'https://t.example/api/ingest', key: 'bps_x', fetch: f, storage: s, logger: quiet });
  await p.trackOrder(order);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].opts.headers['X-API-Key'], 'bps_x');
  assert.equal(sent[0].opts.keepalive, true);
  assert.equal(JSON.parse(sent[0].opts.body).eventId, 'ORD-1-ABC');
  assert.equal(p.queued(), 0);
});

test('keeps orders when offline and sends them later, once each', async () => {
  let online = false;
  const sent = [];
  const f = async (url, opts) => {
    if (!online) throw new Error('offline');
    sent.push(JSON.parse(opts.body).eventId);
    return { ok: true, status: 201 };
  };
  const s = memory();
  const p = createPulse({ url: 'https://t.example/api/ingest', key: 'bps_x', fetch: f, storage: s, logger: quiet });
  await p.trackOrder(order);
  await p.trackOrder(order); // same order twice is queued once
  await p.trackOrder({ ...order, orderID: 'ORD-2' });
  assert.equal(p.queued(), 2);
  // a fresh page load reads the same storage
  online = true;
  const later = createPulse({ url: 'https://t.example/api/ingest', key: 'bps_x', fetch: f, storage: s, logger: quiet });
  await later.flush();
  assert.deepEqual(sent, ['ORD-1-ABC', 'ORD-2']);
  assert.equal(later.queued(), 0);
});

test('a rejected order is dropped so it cannot block the rest; 429 waits', async () => {
  const statuses = [400, 201];
  const f = async () => { const st = statuses.shift(); return { ok: st < 400, status: st }; };
  const p = createPulse({ url: 'https://t.example/api/ingest', key: 'bps_x', fetch: f, storage: memory(), logger: quiet });
  await p.trackOrder(order);
  assert.equal(p.queued(), 0);

  const g = async () => ({ ok: false, status: 429 });
  const q = createPulse({ url: 'https://t.example/api/ingest', key: 'bps_x', fetch: g, storage: memory(), logger: quiet });
  await q.trackOrder(order);
  assert.equal(q.queued(), 1);
});
