// Shared runtime injected into every layer document.
(function () {
  // The parent switcher tells each layer which OS chrome to draw.
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'proto:os') document.body.dataset.os = e.data.os;
    // Layout direction A–E: same tokens, different layout, components and motion (variants.css).
    if (e.data && e.data.type === 'proto:variant') { document.body.dataset.v = e.data.v; document.dispatchEvent(new CustomEvent('proto:variant', { detail: e.data.v })); }
  });
  if (!document.body.dataset.os) document.body.dataset.os = 'mac';
  if (!document.body.dataset.v) document.body.dataset.v = 'a';

  var toastTimer;
  window.toast = function (text) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.querySelector('span').textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  };
  window.wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  window.openModal = function (id) { document.getElementById(id).classList.add('open'); };
  window.closeModal = function (id) { document.getElementById(id).classList.remove('open'); };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.scrim.open').forEach(function (s) { s.classList.remove('open'); });
  });
})();
