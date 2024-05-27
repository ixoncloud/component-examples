export function runResizeObserver(el: HTMLElement, callback: (rect: DOMRectReadOnly) => void): ResizeObserver {
  const rect = el.getBoundingClientRect();
  callback(rect);
  const observer = new ResizeObserver(entries => {
    requestAnimationFrame(() => {
      entries.forEach(entry => {
        callback(entry.contentRect);
      });
    });
  });
  observer.observe(el);
  return observer;
}
