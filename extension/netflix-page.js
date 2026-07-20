// Runs in Netflix's own page context so it can reach Netflix's player API.
// Content scripts live in an isolated world and cannot see `netflix.*`, which is
// why this file is injected separately and talks back via window.postMessage.
(() => {
  if (window.__wtNetflixSync) return;
  window.__wtNetflixSync = true;

  const DRIFT = 1.5;        // seconds out of step before we correct
  let suppress = false;     // set while applying a remote change, to avoid echo
  let last = { paused: null, time: -1 };

  function player() {
    try {
      const api = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
      const ids = api.getAllPlayerSessionIds();
      if (!ids || !ids.length) return null;
      return api.getVideoPlayerBySessionId(ids[0]);
    } catch (e) { return null; }
  }

  const send = (ev) => window.postMessage({ source: 'wt-netflix-page', ev }, '*');

  function readState() {
    const p = player();
    if (!p) return null;
    try {
      return { time: p.getCurrentTime() / 1000, paused: p.isPaused() };
    } catch (e) { return null; }
  }

  // ---- apply what the other person did ----
  function apply(ev) {
    const p = player();
    if (!p) return;
    suppress = true;
    try {
      if (typeof ev.t === 'number') {
        const here = p.getCurrentTime() / 1000;
        if (Math.abs(here - ev.t) > DRIFT) p.seek(Math.round(ev.t * 1000));
      }
      if (ev.a === 'play'  && p.isPaused())  p.play();
      if (ev.a === 'pause' && !p.isPaused()) p.pause();
      if (ev.a === 'sync') {
        if (ev.paused && !p.isPaused()) p.pause();
        if (!ev.paused && p.isPaused()) p.play();
      }
    } catch (e) {}
    setTimeout(() => { suppress = false; }, 700);
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const d = e.data;
    if (!d || d.source !== 'wt-netflix-apply') return;
    apply(d.ev || {});
  });

  // ---- notice what this person does ----
  setInterval(() => {
    if (suppress) return;
    const s = readState();
    if (!s) return;

    if (last.paused === null) { last = s; return; }

    if (s.paused !== last.paused) {
      send({ a: s.paused ? 'pause' : 'play', t: s.time });
    } else if (Math.abs(s.time - last.time) > 2.5 && !s.paused) {
      // a jump larger than the poll interval means they dragged the scrubber
      send({ a: 'seek', t: s.time });
    }
    last = s;
  }, 400);

  // a heartbeat so a late joiner lands in the right place
  setInterval(() => {
    if (suppress) return;
    const s = readState();
    if (s) send({ a: 'sync', t: s.time, paused: s.paused });
  }, 5000);

  send({ a: 'ready' });
})();
