import type { ComponentContext } from '@ixon-cdk/types';

export function themeIsDark(context: ComponentContext): boolean {
  const loaderEl = document.querySelector(`ix-component-loader[data-component-id="${context['_componentId']}"]`);
  if (loaderEl) {
    const scheme = getComputedStyle(loaderEl).getPropertyValue('--card-color-scheme');
    if (scheme) {
      return scheme === 'dark';
    }
  }
  return false;
}
