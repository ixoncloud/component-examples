import type { Inputs } from '../types';

/**
 * Adds default value for the newly defined 'outputType' and 'duration' option.
 *
 * Affected components:
 * - calculate-single-value
 *
 * @param inputs
 * @returns (possibly) migrated inputs
 */
export function addDefaultOutputTypeAndDuration(inputs: Inputs) {
  if ('calculation' in inputs) {
    return {
      ...inputs,
      calculation: {
        ...inputs.calculation,
        outputType: inputs.calculation?.outputType || 'duration-short',
        timePrecision: inputs.calculation?.timePrecision || 'minutes',
      },
    };
  }
  return inputs;
}
