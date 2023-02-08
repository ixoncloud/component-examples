function fromNumber(value) {
  return Number(value);
}

function fromString(value) {
  return String(value);
}

function ruleToPredicate(rule, value) {
  const threshold = rule.value;
  const type = typeof value;
  if (type !== 'string') {
    switch (rule.operator) {
      case 'eq':
        return fromNumber(value) === fromNumber(threshold);
      case 'ne':
        return fromNumber(value) !== fromNumber(threshold);
      case 'lt':
        return fromNumber(value) < fromNumber(threshold);
      case 'le':
        return fromNumber(value) <= fromNumber(threshold);
      case 'gt':
        return fromNumber(value) > fromNumber(threshold);
      case 'ge':
        return fromNumber(value) >= fromNumber(threshold);
    }
  } else {
    const comparison = fromString(value).localeCompare(fromString(threshold));
    switch (rule.operator) {
      case 'eq':
        return comparison === 0;
      case 'ne':
        return comparison !== 0;
      case 'lt':
        return comparison < 0;
      case 'le':
        return comparison <= 0;
      case 'gt':
        return comparison > 0;
      case 'ge':
        return comparison >= 0;
    }
  }
}

export function mapValueToRule(value, rules) {
  return rules.find(item => ruleToPredicate(item.rule, value));
}

export function mapValueToRuleIndex(value, rules) {
  return rules.findIndex(item => ruleToPredicate(item.rule, value));
}
