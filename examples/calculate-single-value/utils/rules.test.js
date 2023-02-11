import { mapValueToRule, mapValueToRuleIndex } from './rules';

describe('mapValueToRule', () => {
  it('works with int value', () => {
    expect(
      mapValueToRule(3, [
        {
          rule: {
            operator: 'ge',
            value: '3',
            color: '#FB3633',
            colorUsage: 'background',
          },
        },
        {
          rule: {
            operator: 'le',
            value: '3',
            color: '#FB3633',
            colorUsage: 'background',
          },
        },
      ])
    ).toEqual({
      rule: {
        operator: 'ge',
        value: '3',
        color: '#FB3633',
        colorUsage: 'background',
      },
    });
  });
  describe('works with string value', () => {
    const rules = [
      {
        rule: {
          operator: 'ge',
          value: 'bob',
          color: '#FB3633',
          colorUsage: 'background',
        },
      },
      {
        rule: {
          operator: 'le',
          value: 'bob',
          color: '#FB3633',
          colorUsage: 'background',
        },
      },
      {
        rule: {
          operator: 'lt',
          value: '10',
          color: '#FB3633',
          colorUsage: 'background',
        },
      },
    ];

    it('alice <= bob', () => {
      expect(mapValueToRule('alice', rules)).toEqual({
        rule: {
          operator: 'le',
          value: 'bob',
          color: '#FB3633',
          colorUsage: 'background',
        },
      });
      expect(mapValueToRuleIndex('alice', rules)).toBe(1);
    });

    it('charly >= bob', () => {
      expect(mapValueToRule('charlie', rules)).toEqual({
        rule: {
          operator: 'ge',
          value: 'bob',
          color: '#FB3633',
          colorUsage: 'background',
        },
      });
      expect(mapValueToRuleIndex('charlie', rules)).toBe(0);
    });

    /**
     * NOTE: This is lexicographic sorting. localCompare() does have numerical sorting capabilities as well...
     */
    describe('number sorting (<= "10")', () => {
      const numericRules = [
        {
          rule: {
            operator: 'le',
            value: '10',
            color: '#FB3633',
            colorUsage: 'background',
          },
        },
      ];

      it('"1": true', () => {
        expect(mapValueToRule('1', numericRules)).toEqual({
          rule: {
            operator: 'le',
            value: '10',
            color: '#FB3633',
            colorUsage: 'background',
          },
        });
        expect(mapValueToRuleIndex('1', numericRules)).toBe(0);
      });
      it('"2": false', () => {
        expect(mapValueToRule('2', numericRules)).toBeUndefined();
        expect(mapValueToRuleIndex('2', numericRules)).toBe(-1);
      });
      it('"10": true', () => {
        expect(mapValueToRule('10', numericRules)).toEqual({
          rule: {
            operator: 'le',
            value: '10',
            color: '#FB3633',
            colorUsage: 'background',
          },
        });
        expect(mapValueToRuleIndex('10', numericRules)).toBe(0);
      });
      it('"100": false', () => {
        expect(mapValueToRule('100', numericRules)).toBeUndefined();
        expect(mapValueToRuleIndex('100', numericRules)).toBe(-1);
      });
    });
  });
});
