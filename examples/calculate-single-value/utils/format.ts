import { Duration } from 'luxon';

/**
 * Returns a formatted datetime string for the given timestamp.
 *
 * @param locale - The locale
 * @param translations - The translations
 * @param timezone - The timezone
 * @param timestampInSeconds - The timestamp in unit s
 * @param showDate - Whether the date should be shown
 * @param showTime - Whether the time should be shown
 * @param showSeconds - Whether the seconds should be shown
 * @returns A formatted date string
 */
export function valueToFormattedDateTime(
  locale: string,
  translations: Record<string, string>,
  timezone: string,
  timestampInSeconds: number,
  showDate = true,
  showTime = true,
  showSeconds = true,
): string {
  // set default error message
  const invalidNumber = translations['__MESSAGE__.INVALID_NUMBER'];

  // cancel if the given timestamp is negative
  if (timestampInSeconds < 0) {
    console.error('Error: timestamp is negative');
    return invalidNumber;
  }

  // create date object
  const dateTime = new Date(timestampInSeconds * 1000);

  // number styles
  const yearStyle = 'numeric';
  const monthStyle = '2-digit';
  const defaultStyle = '2-digit';

  // construct options based on parameters
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
  };

  // add date options if requested
  if (showDate) {
    options.year = yearStyle;
    options.month = monthStyle;
    options.day = defaultStyle;
  }

  // add time options if requested
  if (showTime) {
    options.hour = defaultStyle;
    options.minute = defaultStyle;

    // add seconds if requested
    if (showSeconds) {
      options.second = defaultStyle;
    }
  }

  return Intl.DateTimeFormat(locale, options).format(dateTime);
}

/**
 * Returns a formatted duration string for the given duration.
 *
 * @param translations - The translations
 * @param useLocalDurationUnits - Whether local duration units should be used
 * @param durationInSeconds - The duration in unit s
 * @param showSeconds - Whether the seconds should be shown
 * @returns A formatted duration string
 */
export function valueToFormattedDuration(
  translations: Record<string, string>,
  useLocalDurationUnits: boolean,
  durationInSeconds: number,
  showSeconds = true,
): string {
  // set default error message
  const invalidNumber = translations['__MESSAGE__.INVALID_NUMBER'];

  // parse value
  const durationMillis = durationInSeconds * 1000;
  // Check for potential overflow
  const MAX_SAFE_DURATION = 8.64e15; // 100 million days in milliseconds
  if (durationMillis > MAX_SAFE_DURATION) {
    console.error('Error: duration is too large');
    return invalidNumber;
  }
  const timestamp = Duration.fromMillis(durationMillis).shiftTo('days', 'hours', 'minutes', 'seconds', 'milliseconds');
  const params = timestamp.toFormat('d h m s S').split(' ');

  // cancel if not all parameters could be created
  if (params.length !== 5) {
    console.error('Error: duration parameters could not be created');
    return invalidNumber;
  }

  // extract required duration parameters
  const days = parseInt(params[0]);
  const hours = parseInt(params[1]);
  const minutes = parseInt(params[2]);
  const seconds = parseInt(params[3]);
  const milliseconds = parseInt(params[4]);

  // set whether milliseconds should be displayed
  const showMilliseconds = milliseconds !== 0 && !days && !hours && !minutes && !seconds;

  if (useLocalDurationUnits) {
    const daysUnit = translations['__TIME__.DAYS'] ?? 'Days';
    const hoursUnit = translations['__TIME__.HOURS'] ?? 'Hours';
    const minutesUnit = translations['__TIME__.MINUTES'] ?? 'Minutes';
    const secondsUnit = translations['__TIME__.SECONDS'] ?? 'Seconds';
    const millisecondsUnit = translations['__TIME__.MILLISECONDS'] ?? 'Milliseconds';

    let formattedDuration = `${hours} ${hoursUnit}, ${minutes} ${minutesUnit}`;

    if (showSeconds) {
      formattedDuration += `, ${seconds} ${secondsUnit}`;
    }
    if (days !== 0) {
      formattedDuration = `${days} ${daysUnit}, ${formattedDuration}`;
    }
    if (showMilliseconds) {
      formattedDuration = `${milliseconds} ${millisecondsUnit}`;
    }

    return formattedDuration;
  } else {
    let formattedDuration = `${hours}h ${minutes}m`;

    if (showSeconds) {
      formattedDuration += ` ${seconds}s`;
    }
    if (days !== 0) {
      formattedDuration = `${days}d ${formattedDuration}`;
    }
    if (showMilliseconds) {
      formattedDuration = `${milliseconds}ms`;
    }

    return formattedDuration;
  }
}

/**
 * Returns a formatted string for the given value.
 *
 * @param locale - The locale
 * @param value - The value
 * @param numDecimals - The number of decimals
 * @param unit - The unit
 * @returns A formatted string
 */
export function valueToString(
  locale: string,
  value: number | string | boolean,
  numDecimals: number,
  unit: string,
): string {
  if (typeof value === 'number') {
    // set options
    const options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: Math.floor(numDecimals),
      maximumFractionDigits: Math.floor(numDecimals),
    };

    // set formatter
    const formatter = new Intl.NumberFormat(locale, options);

    return `${formatter.format(value)}${unit ? ' ' + unit : ''}`;
  }
  return `${value.toString()}${unit ? ' ' + unit : ''}`;
}
