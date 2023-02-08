export * from './chart.service';
export * from './data.service';
export * from './rules';
export * from './state';
export * from './time-format';

export function runResizeObserver(el, callback) {
  const rect = el.getBoundingClientRect();
  callback(rect);
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      callback(entry.contentRect);
    }
  });
  observer.observe(el);
  return observer;
}
