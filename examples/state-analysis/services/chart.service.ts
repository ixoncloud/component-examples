import * as echarts from 'echarts/core';
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { BarChart, PieChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([
  BarChart,
  CanvasRenderer,
  GridComponent,
  LegendComponent,
  PieChart,
  TitleComponent,
  TooltipComponent,
]);

type Input = { [key: string]: number };
type DataType = 'occurrences' | 'duration';
type ChartDataValue = {
  value: number;
  label: { position: string };
  itemStyle?: { color: string };
  name?: string;
};
type ChartData = { key: string; val: ChartDataValue }[];
type PieData = {
  value: number;
  name: string;
  itemStyle:
    | {
        color: string;
      }
    | undefined;
}[];

import type { Rules } from '../utils/rules';

import { mapValueToRuleIndex } from '../utils/rules';
import { durationToFormattedTimeStamp } from '../utils/format';

export class ChartService {
  chartEl;
  myChart;
  input: Input;
  visualisation;
  rules: Rules;
  dataType: DataType;

  constructor(chartEl: HTMLDivElement) {
    this.chartEl = chartEl;
    this.myChart = echarts.init(this.chartEl);
    this.input = {};
    this.visualisation = '';
    this.rules = [];
    this.dataType = 'occurrences';
  }

  setData(
    input: Input,
    visualisation: string,
    rules: Rules,
    isNarrow: boolean,
    dataType: DataType
  ) {
    this.input = input;
    this.visualisation = visualisation;
    this.rules = rules;
    this.dataType = dataType;

    const inputsArray = Object.keys(input).map((k) => {
      return { label: k, value: input[k] };
    });
    const sortedInputsArrayDescending = inputsArray.sort((a, b) => {
      return b.value - a.value;
    });

    if (sortedInputsArrayDescending.length > 25) {
      this.showError(
        'The selected tag has too many states.\nThe maximum number of states is 25.'
      );
      return;
    }

    const largestValue = sortedInputsArrayDescending[0]?.value;

    const chartData: ChartData = sortedInputsArrayDescending.map((k) => {
      const rule = mapValueToRuleIndex(k.label, rules);
      const position = largestValue / 4 > k.value ? 'right' : 'inside';
      const val: ChartDataValue = {
        value: dataType === 'duration' ? k.value / 1000 : k.value,
        label: { position },
      };
      if (rule !== -1) {
        val.itemStyle = { color: rules[rule].rule.color };
        val.name = rules[rule].rule.name;
      } else {
        val.name = k.label;
      }
      return {
        key: val.name,
        val,
      };
    });

    if (visualisation === 'bars') {
      if (dataType === 'occurrences') {
        this.createOccBarChart(chartData);
      } else if (dataType === 'duration') {
        this.createDurBarChart(chartData);
      }
    } else if (visualisation === 'pie') {
      const pieData: PieData = chartData.map((data) => ({
        value: data.val.value,
        name: data.key,
        itemStyle: data.val.itemStyle,
      }));
      if (dataType === 'occurrences') {
        this.createOccPie(pieData, isNarrow);
      } else if (dataType === 'duration') {
        this.createDurPie(pieData, isNarrow);
      }
    }
  }

  showLoading() {
    if (this.myChart) {
      this.myChart.showLoading();
    }
  }

  showError(errorMessage: string) {
    if (this.myChart) {
      this.myChart.hideLoading();
      this.myChart.clear();
      this.myChart.setOption({
        title: {
          show: true,
          text: errorMessage,
          left: 'center',
          top: 'middle',
        },
      });
    }
  }

  resize(isNarrow: boolean) {
    if (this.myChart) {
      this.myChart.resize();
    }
    this.setData(
      this.input,
      this.visualisation,
      this.rules,
      isNarrow,
      this.dataType
    );
  }

  private getBarOptions() {
    return {
      grid: {
        left: '8',
        top: '8',
        right: '8',
        bottom: '8',
        containLabel: true,
      },
      title: {
        show: false,
      },

      xAxis: {
        type: 'value',
        position: 'top',
        splitLine: {
          lineStyle: {
            type: 'dashed',
          },
        },
      },
    };
  }
  private getPieOptions() {
    return {
      legend: {
        type: 'scroll',
        orient: 'vertical',
      },
      series: [],
    };
  }

  private createOccPie(pieData: PieData, isNarrow: boolean) {
    const name = 'Occurrences';
    const formatter = (value: any) => value;
    this.createPieChart(pieData, name, formatter, isNarrow);
  }

  private createDurPie(pieData: PieData, isNarrow: boolean) {
    const name = 'Duration';
    const formatter = durationToFormattedTimeStamp;
    this.createPieChart(pieData, name, formatter, isNarrow);
  }

  private createPieChart(
    chartData: PieData,
    chartName: string,
    valueFormatter: Function,
    isNarrow: boolean
  ) {
    const series = [
      {
        name: chartName,
        type: 'pie',
        radius: '50%',
        data: chartData,
        emphasis: {
          disabled: true,
        },
        label: {
          formatter: (args: { data: { value: any; name: string } }) => {
            const value = valueFormatter(args.data.value);
            return `${args.data.name}\n${value}`;
          },
        },
      },
    ];
    const legend = {
      type: 'scroll',
      orient: isNarrow ? 'horizontal' : 'vertical',
      left: 'left',
      bottom: isNarrow ? 0 : undefined,
    };
    this.myChart.setOption({ ...this.getPieOptions(), series, legend });
    this.myChart.hideLoading();
  }

  private createOccBarChart(chartData: ChartData) {
    const name = 'Occurrences';
    const formatter = (value: any) => value;
    this.createBarChart(chartData, name, formatter);
  }

  private createDurBarChart(chartData: ChartData) {
    const name = 'Duration';
    const formatter = durationToFormattedTimeStamp;
    this.createBarChart(chartData, name, formatter);
  }

  private createBarChart(
    chartData: ChartData,
    chartName: string,
    valueFormatter: Function
  ) {
    // For some reason echarts draws the bars in the reverse order of the data
    chartData = chartData.reverse();

    const keys = chartData.map((x) => x.key);
    const yAxis = {
      type: 'category',
      axisLine: { show: false },
      axisLabel: { show: true },
      axisTick: { show: false },
      splitLine: { show: false },
      data: keys,
    };
    const series = [
      {
        name: chartName,
        type: 'bar',
        stack: 'Total',
        label: {
          show: true,
          formatter: (args: { data: { value: any } }) => {
            return valueFormatter(args.data.value);
          },
        },
        data: chartData.map((x) => x.val),
      },
    ];
    const xAxis = {
      type: 'value',
      show: false,
    };
    this.myChart.setOption({
      ...this.getBarOptions(),
      xAxis,
      yAxis,
      series,
    });
    this.myChart.hideLoading();
  }
}
