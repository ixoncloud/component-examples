import { countBy } from 'lodash-es';
import { DateTime } from 'luxon';

export function calculateOccurrences(data: { time: number; value: any }[]) {
  const values = data.map(x => x.value);
  const occurences = countBy(values);
  return occurences;
}

export function calculateDurationsInMilliseconds(
  data: { time: number; value: any }[],
  timeRangeEnd: number,
): { [key: string]: number } {
  const results: { [key: string]: number } = {};
  data.map((current, index) => {
    const isFirst = index === 0;
    if (isFirst) {
      const isNow = DateTime.utc().toMillis();
      const end = timeRangeEnd > isNow ? isNow : timeRangeEnd;
      const currentDateTime = DateTime.fromMillis(end);
      const previousDateTime = DateTime.fromMillis(current.time);
      const difference = currentDateTime.diff(previousDateTime).toObject();
      const value = current.value;
      const accumulator = results[value] ? results[value] : 0;
      const increase = difference?.milliseconds || 0;
      results[value] = accumulator + increase;
    }
    const previous = data[index + 1];
    if (previous) {
      const currentDateTime = DateTime.fromMillis(current.time);
      const previousDateTime = DateTime.fromMillis(previous.time);
      const difference = currentDateTime.diff(previousDateTime).toObject();
      const value = previous.value;
      const accumulator = results[value] ? results[value] : 0;
      const increase = difference?.milliseconds || 0;
      results[value] = accumulator + increase;
    }
  });
  return results;
}
