'use client';

const REALTIME_EVENT = 'kavana:realtime-update';
const REALTIME_CHANNEL = 'kavana-realtime';

function canUseDom() {
  return typeof window !== 'undefined';
}

function createPayload(prefixes = [], meta = {}) {
  return {
    prefixes: Array.isArray(prefixes) ? prefixes : [],
    timestamp: Date.now(),
    ...meta,
  };
}

function dispatchRealtimeEvent(payload) {
  if (!canUseDom()) return;
  window.dispatchEvent(new CustomEvent(REALTIME_EVENT, { detail: payload }));
}

function postRealtimeBroadcast(payload) {
  if (!canUseDom() || typeof BroadcastChannel === 'undefined') return;

  const channel = new BroadcastChannel(REALTIME_CHANNEL);
  channel.postMessage(payload);
  channel.close();
}

export function notifyRealtimeUpdate(prefixes = [], meta = {}) {
  const payload = createPayload(prefixes, meta);
  dispatchRealtimeEvent(payload);
  postRealtimeBroadcast(payload);
}

export function subscribeRealtimeUpdates(listener) {
  if (!canUseDom()) return () => {};

  const handleEvent = (event) => listener(event.detail || {});
  window.addEventListener(REALTIME_EVENT, handleEvent);

  let channel = null;
  let handleMessage = null;

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(REALTIME_CHANNEL);
    handleMessage = (event) => listener(event.data || {});
    channel.addEventListener('message', handleMessage);
  }

  return () => {
    window.removeEventListener(REALTIME_EVENT, handleEvent);
    if (channel && handleMessage) {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    }
  };
}
