/*
 * Business Pulse connection settings.
 * url: your published tracker address + /api/ingest
 * key: the "Online store key" from the tracker's Connect page (starts with bps_).
 *      It is safe to publish: it can only add pending, unverified sales.
 *      Never put the private API key (bp_...) here.
 * currency: the currency your shop prices are in. It is noted on every order.
 * Leave url or key empty to switch the connection off.
 */
window.LUCID_PULSE_CONFIG = {
  url: '',
  key: '',
  currency: 'USD',
};
