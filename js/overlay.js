const stack = [];
const FOCUSABLE = 'button, a[href], input, [tabindex]:not([tabindex="-1"])';

export function openOverlay(html, { label = '', cls = '', onClose } = {}) {
  const el = document.createElement('div');
  el.className = `overlay ${cls}`;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', label);
  el.innerHTML = html;
  document.body.appendChild(el);
  document.body.classList.add('has-overlay');
  const entry = { el, prevFocus: document.activeElement, onClose, after: null };
  stack.push(entry);
  history.pushState({ ov: stack.length }, '');
  (el.querySelector('[data-autofocus]') || el.querySelector(FOCUSABLE))?.focus();
  return { el, close: after => { entry.after = after || null; history.back(); } };
}

export const overlayOpen = () => stack.length > 0;

window.addEventListener('popstate', () => {
  const e = stack.pop();
  if (!e) return;
  e.el.remove();
  if (!stack.length) document.body.classList.remove('has-overlay');
  e.onClose?.();
  e.prevFocus?.focus?.();
  e.after?.();
});

document.addEventListener('keydown', ev => {
  if (!stack.length) return;
  const top = stack[stack.length - 1].el;
  if (ev.key === 'Escape') { ev.preventDefault(); history.back(); return; }
  if (ev.key !== 'Tab') return;
  const f = [...top.querySelectorAll(FOCUSABLE)];
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  const a = document.activeElement, inside = f.includes(a);
  if (ev.shiftKey && (!inside || a === first)) { ev.preventDefault(); last.focus(); }
  else if (!ev.shiftKey && (!inside || a === last)) { ev.preventDefault(); first.focus(); }
});
