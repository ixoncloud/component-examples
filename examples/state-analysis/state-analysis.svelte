<script>
  import { onMount, tick } from 'svelte';

  import { ChartService } from './utils/chart.service';
  import { DataService } from './utils/data.service';
  import {
    calculateOccurrences,
    calculateDurationsInMilliseconds,
  } from './utils/state';
  import { runResizeObserver } from './utils';

  export let context;

  let chartEl;
  let rootEl;
  let header;
  let width = 0;

  $: isNarrow = width < 640;

  async function getDataAndDrawVisuals(chartService) {
    chartService.showLoading();
    const data = await new DataService(context).getAllRawMetrics();
    if (data === null) {
      chartService.showError();
      return;
    }
    const visualisation = context.inputs.style.visualisation;
    const rules = context.inputs.rules;

    if (context.inputs.analysis.type === 'occurrences') {
      const occurrences = calculateOccurrences(data);
      chartService.setData(
        occurrences,
        visualisation,
        rules,
        isNarrow,
        'occurrences'
      );
    } else if (context.inputs.analysis.type === 'duration') {
      const durations = calculateDurationsInMilliseconds(
        data,
        context.timeRange.to
      );
      chartService.setData(
        durations,
        visualisation,
        rules,
        isNarrow,
        'duration'
      );
    }
    setTimeout(() => {
      chartService.resize(isNarrow);
    }, 1000);
  }

  onMount(async () => {
    width = rootEl.getBoundingClientRect().width;

    if (!context.inputs.analysis.type || !context.inputs.style.visualisation) {
      return;
    }

    const chartService = new ChartService(chartEl);

    header = context ? context.inputs.header : undefined;

    const resizeObserver = runResizeObserver(rootEl, () => {
      tick().then(() => {
        if (!rootEl) return;
        width = rootEl.getBoundingClientRect().width;
        chartService.resize(isNarrow);
      });
    });

    getDataAndDrawVisuals(chartService);

    context.ontimerangechange = async () => {
      getDataAndDrawVisuals(chartService);
    };

    return () => {
      context.ontimerangechange = null;
      resizeObserver?.disconnect();
    };
  });
</script>

<div class="card" bind:this="{rootEl}">
  {#if header && (header.title || header.subtitle)}
    <div class="card-header">
      {#if header.title}
        <h3 class="card-title">{header.title}</h3>
      {/if}
      {#if header.subtitle}
        <h4 class="card-subtitle">{header.subtitle}</h4>
      {/if}
    </div>
  {/if}
  <div class="card-content">
    <div class="chart" bind:this="{chartEl}"></div>
  </div>
</div>

<style lang="scss">
  @import './styles/card';

  .card-content {
    overflow: hidden;
  }

  .chart {
    position: relative;
    height: 100%;
    width: 100%;
    -webkit-touch-callout: none;
    user-select: none;
  }
</style>
