<script lang="ts">
  import { onMount, tick } from 'svelte';

  import { ChartService } from './services/chart.service';
  import { DataService } from './services/data.service';

  import {
    calculateOccurrences,
    calculateDurationsInMilliseconds,
  } from './utils/state';

  import type { ComponentContext, ResourceDataClient } from '@ixon-cdk/types';

  import { runResizeObserver } from './utils/resize-observer';

  export let context: ComponentContext;

  let chartEl: HTMLDivElement;
  let rootEl: HTMLDivElement;
  let resourceClient: ResourceDataClient;
  let header: { title: string; subtitle: string };
  let width = 0;

  $: isNarrow = width < 640;

  onMount(() => {
    width = rootEl.getBoundingClientRect().width;

    if (!context.inputs.analysis.type || !context.inputs.style.visualisation) {
      return;
    }

    const chartService = new ChartService(chartEl);

    header = context ? context.inputs.header : undefined;

    resourceClient = context.createResourceDataClient();

    const resizeObserver = runResizeObserver(rootEl, () => {
      tick().then(() => {
        if (!rootEl) return;
        width = rootEl.getBoundingClientRect().width;
        chartService.resize(isNarrow);
      });
    });

    getDataAndDrawVisuals(chartService);

    context.ontimerangechange = () => {
      getDataAndDrawVisuals(chartService);
    };

    return () => {
      context.ontimerangechange = null;
      resizeObserver?.disconnect();
    };
  });

  async function getDataAndDrawVisuals(chartService: ChartService) {
    chartService.showLoading();
    const data = await new DataService(
      context,
      resourceClient,
    ).getAllRawMetrics();
    if (data === null) {
      chartService.showError('Error check your inputs');
      return;
    }
    if (data.length === 0) {
      chartService.showError('No data found in selected period');
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
        'occurrences',
      );
    } else if (context.inputs.analysis.type === 'duration') {
      const durations = calculateDurationsInMilliseconds(
        data,
        context.timeRange.to,
      );
      chartService.setData(
        durations,
        visualisation,
        rules,
        isNarrow,
        'duration',
      );
    }
    setTimeout(() => {
      chartService.resize(isNarrow);
    }, 1000);
  }
</script>

<div class="card" bind:this={rootEl}>
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
    <div class="chart" bind:this={chartEl} />
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
