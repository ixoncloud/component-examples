import { Duration } from 'luxon';

export function durationToformattedTimeStamp(durationSeconds) {
  const durationMillis = durationSeconds * 1000;
  const timestamp = Duration.fromMillis(durationMillis).shiftTo(
    'days',
    'hours',
    'minutes'
  );
  const daysHoursAndMinutes = timestamp.toFormat('d h m s').split(' ');
  const days = daysHoursAndMinutes[0];
  const hours = daysHoursAndMinutes[1];
  const minutes = daysHoursAndMinutes[2];
  const seconds = daysHoursAndMinutes[3];
  const hoursAndMinutes = `${hours}h ${minutes}m ${seconds}s`;
  if (days > 0) {
    return `${days}d ${hoursAndMinutes}`;
  }
  return hoursAndMinutes;
}
