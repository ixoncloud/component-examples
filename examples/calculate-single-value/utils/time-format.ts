import { Duration } from 'luxon';

export function durationToformattedTimeStamp(durationSeconds: number) {
  const durationMillis = durationSeconds * 1000;
  const timestamp = Duration.fromMillis(durationMillis).shiftTo(
    'days',
    'hours',
    'minutes'
  );
  const daysHoursAndMinutes = timestamp.toFormat('d h m').split(' ');
  const days = parseInt(daysHoursAndMinutes[0]);
  const hours = parseInt(daysHoursAndMinutes[1]);
  const minutes = parseInt(daysHoursAndMinutes[2]);
  const hoursAndMinutes = `${hours}h ${minutes}m`;
  if (days > 0) {
    return `${days}d ${hoursAndMinutes}`;
  }
  return hoursAndMinutes;
}
