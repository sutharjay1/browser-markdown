/**
 * Polls a URL and calls onChange when its text content differs from the last
 * seen version. XHR instead of fetch: Chrome's fetch() rejects file:// URLs
 * outright, while XHR to the document's own URL works in content scripts
 * (with "Allow access to file URLs" enabled).
 */
export function watchFileChanges(
  url: string,
  intervalMs: number,
  initialText: string,
  onChange: (text: string) => void,
): () => void {
  let last = initialText;
  const timer = setInterval(() => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = () => {
      const text = xhr.responseText;
      // Empty responses are treated as transient reads during editor
      // truncate-then-write saves, never rendered.
      if (text && text !== last) {
        last = text;
        onChange(text);
      }
    };
    // Transient read failure while the editor saves — retry next tick.
    xhr.onerror = () => {};
    xhr.send();
  }, intervalMs);
  return () => clearInterval(timer);
}
