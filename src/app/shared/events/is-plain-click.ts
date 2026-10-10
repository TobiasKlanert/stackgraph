/**
 * A click that follows a link in the current tab: primary button, no
 * modifier keys. Ctrl/⌘/Shift/Alt or the middle button open a new tab or
 * window, and handlers that change the current view must then do nothing.
 */
export function isPlainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
}
