import { deburr, get, has, kebabCase } from 'lodash-es';
import { Duration } from 'luxon';

export function getDataExportFileName(title: string | null): string {
  if (title) {
    const componentTitle = formatName(title);
    return `{{pageTitle}}_${componentTitle}_{{timeRangeFrom}}_{{timeRangeTo}}.csv`;
  }
  return 'export.csv';
}

export function formatName(name: string): string {
  return kebabCase(deburr(name));
}

export function listFormatter(lang: string) {
  return function format(list: unknown[], path: string | null = null) {
    if (!list) {
      return '';
    }
    if (path) {
      // eslint-disable-next-line no-param-reassign
      list = list.map(value => get(value, path));
    }
    if (list.length && typeof list[0] !== 'string') {
      return '';
    }
    if (has(Intl, 'ListFormat')) {
      const ListFormatStatic = get(Intl, 'ListFormat');
      const locales = lang;
      const lf = new ListFormatStatic(locales, {
        type: 'conjunction',
        style: 'long',
      });
      return lf.format(list);
    }
    return list.join(', ');
  };
}

export function durationToFormattedTimeStamp(durationInSeconds: number, showSeconds = true): string {
  const durationMillis = durationInSeconds * 1000;
  const timestamp = Duration.fromMillis(durationMillis).shiftTo('days', 'hours', 'minutes');
  const daysHoursAndMinutes = timestamp.toFormat('d h m s').split(' ');
  const days = Number(daysHoursAndMinutes[0]);
  const hours = Number(daysHoursAndMinutes[1]);
  const minutes = Number(daysHoursAndMinutes[2]);
  let formattedTimestamp = `${hours}h ${minutes}m`;
  if (showSeconds) {
    const seconds = Number(daysHoursAndMinutes[3]);
    formattedTimestamp += ` ${seconds}s`;
  }
  if (days !== 0) {
    return `${days}d ${formattedTimestamp}`;
  }
  return formattedTimestamp;
}
