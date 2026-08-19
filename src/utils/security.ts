/**
 * Security & Anti-Inspection Protections
 * Prevents casual inspection, disables shortcut keys, and blocks right-click context menu.
 */
export function initClientSecurity() {
  if (typeof window === 'undefined') return;

  // 1. Disable Right Click (Context Menu)
  document.addEventListener('contextmenu', (e: MouseEvent) => {
    // Allow right click ONLY inside text input/textarea fields if the user needs to paste
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }
    e.preventDefault();
    return false;
  }, false);

  // 2. Block DevTools and Source Viewing Keyboard Shortcuts
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // F12 key
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    // Ctrl+Shift+I / Cmd+Option+I (Inspect)
    // Ctrl+Shift+J / Cmd+Option+J (Console)
    // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
    if (isCtrlOrCmd && e.shiftKey && (
      e.key === 'I' || e.key === 'i' ||
      e.key === 'J' || e.key === 'j' ||
      e.key === 'C' || e.key === 'c' ||
      e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67
    )) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U / Cmd+U (View Page Source)
    if (isCtrlOrCmd && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S / Cmd+S (Save Page)
    if (isCtrlOrCmd && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
}
