<script lang="ts">
  import { onMount } from 'svelte';

  import tinycolor, { type Instance, type MostReadableArgs } from 'tinycolor2';
  import { Parser } from 'expr-eval';

  import type {
    ComponentContext,
    LoggingDataMetric,
    ComponentContextAggregatedMetricInput,
    ComponentContextFactory,
  } from '@ixon-cdk/types';

  import {
    valueToString,
    valueToFormattedDateTime,
    valueToFormattedDuration,
  } from './utils/format';
  import { mapMetricInputToQuery } from './utils/query';
  import { mapValueToRule } from './utils';
  import { addDefaultOutputTypeAndDuration } from './utils/migrate-output-type-duration';
  import type { Inputs } from './types';

  type Variable = {
    name: string;
    metric: ComponentContextAggregatedMetricInput;
  };

  export let contextFactory: ComponentContextFactory;

  let context: ComponentContext<Inputs>;

  let translations: Record<string, string> = {};

  let rootEl: HTMLDivElement;

  // Data
  let height: number | null = null;
  let calculatedValue: number | null = null;
  let text = '';
  let error = '';
  let cardColor: string | null = null;
  let textColor: Instance | null = null;

  // Debugging for studio users
  let debugMode = false;
  let variableKeyValues: any;
  let formula: string = '';

  // Watchers
  $: _metric(calculatedValue);
  function _metric(calculatedValue: number | null) {
    if (calculatedValue !== null) {
      const inputRules: {
        rule: {
          operator: string;
          value: string;
          color: string;
          colorUsage: string;
        };
      }[] = context.inputs.rules;
      const ruleItem = mapValueToRule(calculatedValue, inputRules);
      const rule = ruleItem ? ruleItem.rule : undefined;

      if (rule) {
        if (rule.colorUsage === 'text') {
          textColor = new tinycolor(rule.color);
          cardColor = null;
        } else {
          const color = tinycolor(rule.color);
          const wcag2: MostReadableArgs = { level: 'AA', size: 'small' };
          const readable = tinycolor.isReadable(color, 'black', wcag2);
          textColor = readable
            ? null
            : tinycolor.mostReadable(
                color,
                ['white', '#f0f0f0', '#e0e0e0'],
                wcag2,
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
  $: scaledTextStyle = `fill: ${textColor || 'currentcolor'}`;
  $: cardStyle = _cardStyle(cardColor);
  function _cardStyle(_cardColor: string | null) {
    if (_cardColor) {
      return `background-color: ${_cardColor}`;
    }
    return '';
  }

  $: cardContentTextStyle = _cardContentTextStyle(textColor);
  function _cardContentTextStyle(_textColor: Instance | null) {
    if (_textColor) {
      return `color: ${_textColor}`;
    }
    return '';
  }

  $: hasStaticSize = _hasStaticSize(context);
  function _hasStaticSize(context: ComponentContext) {
    if (context && context.inputs && context.inputs.style) {
      return context.inputs.style.fontSize !== 'auto';
    }
    return false;
  }

  $: staticSizeStyle = _staticSizeStyle(hasStaticSize);
  function _staticSizeStyle(hasStaticSize: boolean) {
    if (hasStaticSize) {
      return `font-size: ${context.inputs.style.fontSize}px;`;
    }
    return null;
  }

  $: svgViewBox = _svgViewBox(text);
  function _svgViewBox(text: string) {
    const textLength = text.length - (text.startsWith('-') ? 1 : 0);
    const fontSize = 14.0;
    const textWidth = textLength * fontSize * 0.6;
    const textHeight = fontSize;
    return `${-textWidth / 2} ${-textHeight / 2} ${textWidth} ${textHeight}`;
  }

  // Events
  onMount(() => {
    context = contextFactory({
      migrateInputs: addDefaultOutputTypeAndDuration,
    });
    debugMode = context.inputs.debugMode;
    context.ontimerangechange = () => {
      calculatedValue = null;
      text = '';
      error = '';
    };

    translations = context.translate([
      '__MESSAGE__.INVALID_NUMBER',
      '__TIME__.DAYS',
      '__TIME__.HOURS',
      '__TIME__.MINUTES',
      '__TIME__.SECONDS',
      '__TIME__.MILLISECONDS',
    ]);

    const client = context.createLoggingDataClient();
    const variables = context.inputs.variables;
    const queries = variables.map((x: { variable: Variable }) => {
      return {
        ...mapMetricInputToQuery(x?.variable?.metric),
        limit: 1,
      };
    });
    const variableNames = variables.map(
      (x: { variable: Variable }) => x?.variable?.name,
    );
    const hasDuplicates = (variableNames: string[]) =>
      variableNames.length !== new Set(variableNames).size;

    if (hasDuplicates(variableNames)) {
      error = 'Please use unique variable names';
      return;
    }

    function processResponse(metrics: LoggingDataMetric[][]) {
      const variableValues = metrics.map(x => {
        const value = x[0]?.value?.getValue();
        return value !== undefined ? Number(value) : 'no-data-in-period';
      });

      const noDataInPeriod =
        variableValues.find(x => x === 'no-data-in-period') !== undefined;
      if (noDataInPeriod) {
        error = 'No data available in selected time period';
        return;
      }

      const notANumber =
        variableValues.find(x => Number.isNaN(x)) !== undefined;
      if (notANumber) {
        error = 'Only works with number variables';
        return;
      }

      variableKeyValues = variableNames.reduce(
        (accumulator: any, value: string, index: number) => {
          return { ...accumulator, [value]: variableValues[index] };
        },
        {},
      );

      // read context
      formula = context?.inputs?.calculation?.formula;
      const decimals = context?.inputs?.calculation?.decimals || 0;
      const unit = context?.inputs?.calculation?.unit || '';
      const locale = context?.appData?.locale;
      const timezone = context?.appData?.timeZone;

      // check whether the value should be displayed as a duration or time
      const useTimeFormat = context?.inputs?.calculation?.useTimeFormatOutput;

      try {
        // parse expression
        calculatedValue = Parser.evaluate(formula, variableKeyValues);

        // cancel if the given duration or time is invalid
        if (!Number.isFinite(calculatedValue)) {
          text = translations['__MESSAGE__.INVALID_NUMBER'];
        }

        if (useTimeFormat) {
          const outputType = context?.inputs?.calculation?.outputType;
          const timePrecision = context?.inputs?.calculation?.timePrecision;
          const showSeconds = timePrecision === 'seconds';

          // format value based on the selected configuration
          switch (outputType) {
            case 'duration-short':
              text = valueToFormattedDuration(
                translations,
                false,
                calculatedValue,
                showSeconds,
              );
              break;
            case 'duration':
              text = valueToFormattedDuration(
                translations,
                true,
                calculatedValue,
                showSeconds,
              );
              break;
            case 'date':
              text = valueToFormattedDateTime(
                locale,
                translations,
                timezone,
                calculatedValue,
                true,
                false,
                false,
              );
              break;
            case 'dateTime':
              text = valueToFormattedDateTime(
                locale,
                translations,
                timezone,
                calculatedValue,
                true,
                true,
                showSeconds,
              );
              break;
            case 'time':
              text = valueToFormattedDateTime(
                locale,
                translations,
                timezone,
                calculatedValue,
                false,
                true,
                showSeconds,
              );
              break;
          }
        } else {
          text = valueToString(locale, calculatedValue, decimals, unit);
        }
      } catch {
        error = 'Invalid formula, example: x / y * 100';
      }
    }
    const cancelQuery = client.query(queries, processResponse);

    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
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

<div class="card" bind:this={rootEl} style={cardStyle}>
  {#if hasHeader}
    <div class="card-header">
      {#if header?.title}
        <h3 class="card-title">{header.title}</h3>
      {/if}
      {#if header?.subtitle}
        <h4 class="card-subtitle">{header.subtitle}</h4>
      {/if}
    </div>
  {/if}
  {#if debugMode && variableKeyValues}
    <p>formula: {formula} -> {calculatedValue}</p>
    {#each Object.entries(variableKeyValues) as [k, v]}
      <span>{k} : {v}</span>
    {/each}
    <p />
  {/if}
  {#if text !== null}
    <div
      class="card-content"
      class:has-header={hasHeader}
      style={cardContentTextStyle}
    >
      {#if error}
        <div class="static" style={staticSizeStyle}>
          <p>{error}</p>
        </div>
      {/if}
      {#if hasStaticSize}
        <div class="static" style={staticSizeStyle}>
          <span>{text}</span>
        </div>
      {:else}
        <div class="scaled">
          <svg viewBox={svgViewBox}>
            <text
              x="0"
              y="0"
              text-anchor="middle"
              dominant-baseline="middle"
              style={scaledTextStyle}>{text}</text
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
