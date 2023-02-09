import { isNumber } from 'lodash-es';

export function metricHasQueryRequirements(metric) {
  return metric && metric.aggregator && metric.selector;
}

export function mapMetricInputToQuery(metric) {
  return {
    selector: metric.selector,
    ...(metric.aggregator ? { postAggr: metric.aggregator } : {}),
    ...(metric.transform ? { postTransform: metric.transform } : {}),
    ...(metric.unit ? { unit: metric.unit } : {}),
    ...(isNumber(metric.decimals) ? { decimals: Number(metric.decimals) } : {}),
    ...(isNumber(metric.factor) ? { factor: Number(metric.factor) } : {}),
  };
}
