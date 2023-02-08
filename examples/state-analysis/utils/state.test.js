import { calculateDurationsInMilliseconds } from './state';

describe('Durations', () => {
  test('Calculate duration with timezone switch from winter to summertime', () => {
    expect(
      calculateDurationsInMilliseconds(
        [
          {
            time: 1648335600000,
            value: 21,
          },
        ],
        1648418399000
      )
    ).toEqual({ 21: 82799000 });
  });
});
