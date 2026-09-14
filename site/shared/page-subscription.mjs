// Suspend live network subscriptions while the page cannot display updates.
export function subscribeWhileVisible(start, page = document, lifecycle = window) {
  let unsubscribe = null;
  let away = false;
  let disposed = false;
  function sync() {
    if (disposed || away || page.hidden) {
      unsubscribe?.();
      unsubscribe = null;
    } else if (!unsubscribe) unsubscribe = start();
  }
  const hide = () => { away = true; sync(); };
  const show = () => { away = false; sync(); };
  page.addEventListener("visibilitychange", sync);
  lifecycle.addEventListener("pagehide", hide);
  lifecycle.addEventListener("pageshow", show);
  sync();
  return () => {
    disposed = true;
    sync();
    page.removeEventListener("visibilitychange", sync);
    lifecycle.removeEventListener("pagehide", hide);
    lifecycle.removeEventListener("pageshow", show);
  };
}
