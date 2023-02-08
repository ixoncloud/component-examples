import { mapValueToRule, mapValueToRuleIndex } from "./rules";

describe("mapValueToRule", () => {
  it("works with ints", () => {
    expect(
      mapValueToRule(3, [
        { rule: { operator: "ge", value: 3 } },
        { rule: { operator: "le", value: 3 } },
      ])
    ).toEqual({ rule: { operator: "ge", value: 3 } });
  });
  describe("works with strings", () => {
    const rules = [
      { rule: { operator: "ge", value: "bob" } },
      { rule: { operator: "le", value: "bob" } },
      { rule: { operator: "lt", value: "10" } },
    ];

    it("alice <= bob", () => {
      expect(mapValueToRule("alice", rules)).toEqual({
        rule: { operator: "le", value: "bob" },
      });
      expect(mapValueToRuleIndex("alice", rules)).toBe(1);
    });

    it("charly >= bob", () => {
      expect(mapValueToRule("charlie", rules)).toEqual({
        rule: { operator: "ge", value: "bob" },
      });
      expect(mapValueToRuleIndex("charlie", rules)).toBe(0);
    });

    /**
     * NOTE: This is lexicographic sorting. localCompare() does have numerical sorting capabilities as well...
     */
    describe('number sorting (<= "10")', () => {
      const numericRules = [{ rule: { operator: "le", value: "10" } }];

      it('"1": true', () => {
        expect(mapValueToRule("1", numericRules)).toEqual({
          rule: { operator: "le", value: "10" },
        });
        expect(mapValueToRuleIndex("1", numericRules)).toBe(0);
      });
      it('"2": false', () => {
        expect(mapValueToRule("2", numericRules)).toBeUndefined();
        expect(mapValueToRuleIndex("2", numericRules)).toBe(-1);
      });
      it('"10": true', () => {
        expect(mapValueToRule("10", numericRules)).toEqual({
          rule: { operator: "le", value: "10" },
        });
        expect(mapValueToRuleIndex("10", numericRules)).toBe(0);
      });
      it('"100": false', () => {
        expect(mapValueToRule("100", numericRules)).toBeUndefined();
        expect(mapValueToRuleIndex("100", numericRules)).toBe(-1);
      });
    });
  });
});
