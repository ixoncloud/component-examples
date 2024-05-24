import { isNumber } from 'lodash-es';
import type {
  ComponentContextAggregatedMetricInput,
  ComponentContextLiveMetricInput,
  LoggingDataQuery,
} from '@ixon-cdk/types';

export function metricHasQueryRequirements(metric: any): boolean {
  return metric && metric.aggregator && metric.selector;
}

export function mapMetricInputToQuery(
  metric: ComponentContextAggregatedMetricInput | ComponentContextLiveMetricInput,
): Partial<LoggingDataQuery> {
  return {
    selector: metric.selector,
    ...('aggregator' in metric && metric.aggregator ? { postAggr: metric.aggregator as any } : {}),
    ...('transform' in metric && metric.transform ? { postTransform: metric.transform } : {}),
    ...(metric.unit ? { unit: metric.unit } : {}),
    ...(isNumber(metric.decimals) ? { decimals: Number(metric.decimals) } : {}),
    ...(isNumber(metric.factor) ? { factor: Number(metric.factor) } : {}),
  };
}
