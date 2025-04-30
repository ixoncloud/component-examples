import type { ComponentContextAggregatedMetricInput } from '@ixon-cdk/types';

export interface Inputs {
  calculation: {
    decimals: number;
    formula: string;
    outputType: string;
    timePrecision: string;
    unit: string;
    useTimeFormatOutput: boolean;
  };
  debugMode: boolean;
  header: {
    subtitle: string | null;
    title: string | null;
  };
  rules: Rule[];
  style: {
    fontSize: string | number;
  };
  variables: {
    variable: {
      metric: ComponentContextAggregatedMetricInput;
      name: string;
    };
  }[];
}

type Operator = 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge';

interface Rule {
  rule: {
    color: string;
    colorUsage: 'text' | 'background';
    operator: Operator;
    value: string;
  };
}
