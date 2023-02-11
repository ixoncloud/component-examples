import { durationToformattedTimeStamp } from './time-format';

test('the timestamp to be 1h 0m when the duration is 3600 seconds', () => {
  expect(durationToformattedTimeStamp(3600)).toBe('1h 0m');
});

test('the timestamp to be 10h 0m when the duration is 36000 seconds', () => {
  expect(durationToformattedTimeStamp(36000)).toBe('10h 0m');
});

test('the timestamp to be 1d 0h 0m when the duration is 86400 seconds', () => {
  expect(durationToformattedTimeStamp(86400)).toBe('1d 0h 0m');
});

test('the timestamp to be 4d 4h 0m when the duration is 360000 seconds', () => {
  expect(durationToformattedTimeStamp(360000)).toBe('4d 4h 0m');
});

test('the timestamp to be 0h 30m when the duration is 1800 seconds', () => {
  expect(durationToformattedTimeStamp(1800)).toBe('0h 30m');
});
