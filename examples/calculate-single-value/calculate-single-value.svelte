<script>
  import { onMount } from 'svelte';
  import tinycolor from 'tinycolor2';
  import { Parser } from 'expr-eval';
  import {
    mapMetricInputToQuery,
    mapValueToRule,
    durationToformattedTimeStamp,
  } from './utils';

  export let context;

  let rootEl;

  // Data
  let height = null;
  let calculatedValue = null;
  let text = '';
  let error = '';
  let cardColor = null;
  let textColor = null;

  // Debugging for studio users
  let debugMode = false;
  let variableKeyValues = {};
  let formula = '';

  // Watchers
  $: _metric(calculatedValue);
  function _metric(calculatedValue) {
    if (calculatedValue !== null) {
      const inputRules = context.inputs.rules;
      const ruleItem = mapValueToRule(calculatedValue, inputRules);
      const rule = ruleItem ? ruleItem.rule : undefined;

      if (rule) {
        if (rule.colorUsage === 'text') {
          textColor = new tinycolor(rule.color);
          cardColor = null;
        } else {
          const color = tinycolor(rule.color);
          const wcag2 = { level: 'AA', size: 'small' };
          const readable = tinycolor.isReadable(color, 'black', wcag2);
          textColor = readable
            ? null
            : tinycolor.mostReadable(
                color,
                ['white', '#f0f0f0', '#e0e0e0'],
                wcag2
              );
          cardColor = rule.color;
        }
      } else {
        textColor = null;
        cardColor = null;
      }
    }
  }

  // Computed properties
  $: hasHeader = header && (header.title || header.subtitle) && !isShallow;
  $: isShallow = height !== null ? height <= 60 : false;
  $: header = context ? context.inputs.header : undefined;
  $: scaledTextStyle = `fill: ${textColor || 'inherit'}`;
  $: cardStyle = _cardStyle(cardColor);
  function _cardStyle(_cardColor) {
    if (_cardColor) {
      return `background-color: ${_cardColor}`;
    }
    return '';
  }

  $: cardContentTextStyle = _cardContentTextStyle(textColor);
  function _cardContentTextStyle(_textColor) {
    if (_textColor) {
      return `color: ${_textColor}`;
    }
    return '';
  }

  $: hasStaticSize = _hasStaticSize(context);
  function _hasStaticSize(context) {
    if (context && context.inputs && context.inputs.style) {
      return context.inputs.style.fontSize !== 'auto';
    }
    return false;
  }

  $: staticSizeStyle = _staticSizeStyle(hasStaticSize);
  function _staticSizeStyle(hasStaticSize) {
    if (hasStaticSize) {
      return `font-size: ${context.inputs.style.fontSize}px;`;
    }
    return null;
  }

  $: svgViewBox = _svgViewBox(text);
  function _svgViewBox(text) {
    const textLength = text.length - (text.startsWith('-') ? 1 : 0);
    const fontSize = 14.0;
    const textWidth = textLength * fontSize * 0.6;
    const textHeight = fontSize;
    return `${-textWidth / 2} ${-textHeight / 2} ${textWidth} ${textHeight}`;
  }

  function toString(value, decimals, unit, locale) {
    const options = {
      style: 'decimal',
      minimumFractionDigits: Math.floor(decimals),
      maximumFractionDigits: Math.floor(decimals),
    };
    const formatter = new Intl.NumberFormat(locale, options);
    return `${formatter.format(value)}${unit ? ' ' + unit : ''}`;
  }

  // Events
  onMount(() => {
    debugMode = context.inputs.debugMode;
    context.ontimerangechange = () => {
      calculatedValue = null;
      text = '';
      error = '';
    };

    const client = context.createLoggingDataClient();
    const { variables } = context.inputs || [];
    const queries = variables.map((x) => {
      return {
        ...mapMetricInputToQuery(x?.variable?.metric),
        limit: 1,
      };
    });
    const variableNames = variables.map((x) => x?.variable?.name);
    const hasDuplicates = (variableNames) =>
      variableNames.length !== new Set(variableNames).size;

    if (hasDuplicates(variableNames)) {
      error = 'Please use unique variable names';
      return;
    }

    function processResponse(metrics) {
      const variableValues = metrics.map((x) => {
        const value = x[0]?.value?.getValue();
        return value !== undefined ? Number(value) : 'no-data-in-period';
      });

      const noDataInPeriod =
        variableValues.find((x) => x === 'no-data-in-period') !== undefined;
      if (noDataInPeriod) {
        error = 'No data available in selected time period';
        return;
      }

      const notANumber =
        variableValues.find((x) => Number.isNaN(x)) !== undefined;
      if (notANumber) {
        error = 'Only works with number variables';
        return;
      }

      variableKeyValues = variableNames.reduce((accumulator, value, index) => {
        return { ...accumulator, [value]: variableValues[index] };
      }, {});

      formula = context.inputs.calculation.formula;
      const decimals = context.inputs.calculation.decimals || 0;
      const unit = context.inputs.calculation.unit;
      const locale = context.appData.locale;

      try {
        calculatedValue = Parser.evaluate(formula, variableKeyValues);
        const useTimeFormat = context?.inputs?.calculation?.useTimeFormatOutput;
        if (useTimeFormat) {
          text = durationToformattedTimeStamp(calculatedValue);
        } else {
          text = toString(calculatedValue, decimals, unit, locale);
        }
      } catch {
        error = 'Invalid formula, example: x / y * 100';
      }
    }
    const cancelQuery = client.query(queries, processResponse);

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        height = entry.contentRect.height;
      });
    });
    resizeObserver.observe(rootEl);

    return () => {
      if (cancelQuery) {
        cancelQuery();
      }
      context.ontimerangechange = null;
      resizeObserver.unobserve(rootEl);
      client.destroy();
    };
  });
</script>

<div class="card" bind:this="{rootEl}" style="{cardStyle}">
  {#if hasHeader}
    <div class="card-header">
      {#if header.title}
        <h3 class="card-title">{header.title}</h3>
      {/if}
      {#if header.subtitle}
        <h4 class="card-subtitle">{header.subtitle}</h4>
      {/if}
    </div>
  {/if}
  {#if debugMode && variableKeyValues}
    <p>formula: {formula} -> {calculatedValue}</p>
    {#each Object.entries(variableKeyValues) as [k, v]}
      <span>{k} : {v}</span>
    {/each}
    <p></p>
  {/if}
  {#if text !== null}
    <div
      class="card-content"
      class:has-header="{hasHeader}"
      style="{cardContentTextStyle}"
    >
      {#if error}
        <div class="static" style="{staticSizeStyle}">
          <p>{error}</p>
        </div>
      {/if}
      {#if hasStaticSize}
        <div class="static" style="{staticSizeStyle}">
          <span>{text}</span>
        </div>
      {:else}
        <div class="scaled">
          <svg viewBox="{svgViewBox}">
            <text
              x="0"
              y="0"
              text-anchor="middle"
              dominant-baseline="middle"
              style="{scaledTextStyle}">{text}</text
            >
          </svg>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  @import './styles/card';

  .card .card-content {
    height: 100%;

    &.has-header {
      height: calc(100% - 40px);
    }

    .static {
      height: 100%;
      display: flex;
      flex-direction: row;
      place-content: center;
      align-items: center;
      flex: 1;

      span {
        white-space: nowrap;
      }
    }

    .scaled {
      height: 100%;
      display: flex;
      justify-content: center;

      svg {
        width: 100%;

        text {
          font-size: 14px;
          fill: var(--body-color);
        }
      }
    }
  }
</style>
