const pointerUpEvent = 'onpointerup' in document ? 'pointerup' : 'mouseup';

function handleLinkClicked(event: MouseEvent) {
  const targetEl = event.target as HTMLElement;

  const anchorEl = targetEl.closest('a');
  if (!anchorEl) return;

  const href = anchorEl.href;
  if (!href) return;

  // tell background process to handle the clicked url
  browser.runtime.sendMessage({
    method: 'linkClicked',
    payload: {
      href: href,
      event: {
        button: event.button,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
      },
    },
  });
}

document.addEventListener(
  pointerUpEvent,
  (event: MouseEvent) => {
    // don't handle right mouse button
    if (event.button === 2) return;

    // only continue with event target
    if (!event.target) return;

    // sometimes websites change links on click
    // so we wait for the next tick and with that increase
    // the chance that we actually see the correct link
    setTimeout(handleLinkClicked, 0, event);
  },
  false
);
