/*
 * Sends every LUCID order to the Business Pulse tracker as a pending sale.
 * Orders wait in localStorage if the tracker cannot be reached and are retried
 * on the next page load, when the connection comes back, and every 30 seconds.
 * Only the name, email, items and totals are sent: no addresses or phone numbers.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LucidPulse = api.autoStart();
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  var QUEUE_KEY = 'lucidPulseQueue';
  var MAX_QUEUE = 100;

  function money(n) {
    var v = Number(n);
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
  }

  function text(v, max) {
    if (v === undefined || v === null) return '';
    return String(v).replace(/\s+/g, ' ').trim().slice(0, max || 120);
  }

  function methodOf(paymentMethod) {
    var m = String(paymentMethod || '').toLowerCase();
    if (m.indexOf('card') !== -1) return 'card';
    if (m.indexOf('mobile') !== -1 || m.indexOf('momo') !== -1) return 'momo';
    if (m.indexOf('cash') !== -1 || m.indexOf('delivery') !== -1) return 'cash';
    return 'other';
  }

  function orderToItem(order, currency) {
    var items = Array.isArray(order.items) ? order.items : [];
    var lines = items.slice(0, 30).map(function (it) {
      var size = it.size && it.size !== 'One Size' ? ' (' + text(it.size, 20) + ')' : '';
      return (it.quantity || 1) + ' x ' + text(it.name, 60) + size;
    });
    var cur = text(currency || 'USD', 3).toUpperCase();
    var parts = [
      'Items: ' + (lines.join(', ') || 'none listed'),
      'Subtotal ' + money(order.subtotal).toFixed(2) +
        ', shipping ' + money(order.shipping).toFixed(2) +
        ', tax ' + money(order.tax).toFixed(2) +
        (money(order.discountAmount) ? ', discount ' + money(order.discountAmount).toFixed(2) : ''),
      'Amounts in ' + cur,
      order.discountCode ? 'Promo ' + text(order.discountCode, 20) : '',
      order.paymentReference ? 'Payment ref ' + text(order.paymentReference, 60) : '',
      'Shop status: ' + text(order.status, 40),
    ].filter(Boolean);
    return {
      direction: 'sale',
      amount: money(order.total),
      category: 'Sales',
      customer: text(order.name, 120) || undefined,
      email: text(order.email, 160) || undefined,
      method: methodOf(order.paymentMethod),
      reference: text(order.orderID, 60),
      notes: parts.join(' | ').slice(0, 1000),
      tags: 'lucid',
      eventId: text(order.orderID, 100),
    };
  }

  function memoryStorage() {
    var data = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
      setItem: function (k, v) { data[k] = String(v); },
    };
  }

  function createPulse(options) {
    var o = options || {};
    var url = text(o.url, 500);
    var key = text(o.key, 200);
    var fetchImpl = o.fetch || (typeof root.fetch === 'function' ? root.fetch.bind(root) : null);
    var store = o.storage || (function () { try { return root.localStorage || memoryStorage(); } catch (e) { return memoryStorage(); } })();
    var logger = o.logger || (typeof console !== 'undefined' ? console : { warn: function () {} });
    var enabled = Boolean(url && key && fetchImpl && /^https?:\/\//i.test(url));
    if (key && key.indexOf('bp_') === 0) {
      // A private key in public code would let anyone rewrite the books.
      logger.warn('[business-pulse] Use the Online store key (bps_...), not the private API key. Connection disabled.');
      enabled = false;
    }
    var sending = null;

    function read() {
      try { var q = JSON.parse(store.getItem(QUEUE_KEY) || '[]'); return Array.isArray(q) ? q : []; } catch (e) { return []; }
    }
    function write(q) {
      try { store.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE))); } catch (e) { /* storage full or blocked */ }
    }

    function post(item) {
      return fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
        body: JSON.stringify(item),
        keepalive: true,
      }).then(function (res) {
        if (res.ok) return 'sent';
        var permanent = res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429;
        return permanent ? 'rejected' : 'retry';
      }, function () { return 'retry'; });
    }

    function flush() {
      if (!enabled) return Promise.resolve();
      if (sending) return sending;
      sending = (function next() {
        var q = read();
        if (!q.length) return Promise.resolve();
        return post(q[0]).then(function (result) {
          if (result === 'retry') return;
          if (result === 'rejected') logger.warn('[business-pulse] tracker rejected order ' + (q[0] && q[0].reference));
          var current = read();
          if (current.length && current[0].eventId === q[0].eventId) current.shift();
          write(current);
          return next();
        });
      })().then(function () { sending = null; }, function () { sending = null; });
      return sending;
    }

    function trackOrder(order) {
      if (!enabled || !order || !order.orderID) return Promise.resolve();
      var item = orderToItem(order, o.currency);
      var q = read().filter(function (x) { return x.eventId !== item.eventId; });
      q.push(item);
      write(q);
      return flush();
    }

    function autoStart() {
      if (!enabled) return api;
      flush();
      if (root.addEventListener) root.addEventListener('online', flush);
      if (root.setInterval) root.setInterval(function () { if (read().length) flush(); }, 30000);
      return api;
    }

    var api = {
      enabled: enabled,
      trackOrder: trackOrder,
      flush: flush,
      queued: function () { return read().length; },
      autoStart: autoStart,
    };
    return api;
  }

  var exported = {
    createPulse: createPulse,
    orderToItem: orderToItem,
    methodOf: methodOf,
    autoStart: function () {
      var cfg = root.LUCID_PULSE_CONFIG || {};
      return createPulse({ url: cfg.url, key: cfg.key, currency: cfg.currency }).autoStart();
    },
  };
  return exported;
});
