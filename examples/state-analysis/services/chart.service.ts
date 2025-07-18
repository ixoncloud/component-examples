import * as echarts from 'echarts/core';
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { BarChart, PieChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import type { Rules } from '../utils/rules';
import { mapValueToRuleIndex } from '../utils/rules';
import { durationToFormattedTimeStamp } from '../utils/format';

echarts.use([BarChart, CanvasRenderer, GridComponent, LegendComponent, PieChart, TitleComponent, TooltipComponent]);

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

export class ChartService {
  chartEl;
  myChart;
  input: Input;
  visualisation;
  rules: Rules;
  dataType: DataType;
  dark: boolean;

  constructor(chartEl: HTMLDivElement, isDark = false) {
    this.chartEl = chartEl;
    this.myChart = echarts.init(this.chartEl);
    this.input = {};
    this.visualisation = '';
    this.rules = [];
    this.dataType = 'occurrences';
    this.dark = isDark;
  }

  setData(input: Input, visualisation: string, rules: Rules, isNarrow: boolean, dataType: DataType) {
    this.input = input;
    this.visualisation = visualisation;
    this.rules = rules;
    this.dataType = dataType;

    const inputsArray = Object.keys(input).map(k => {
      return { label: k, value: input[k] };
    });
    const sortedInputsArrayDescending = inputsArray.sort((a, b) => {
      return b.value - a.value;
    });

    const largestValue = sortedInputsArrayDescending[0]?.value;

    const chartData: ChartData = sortedInputsArrayDescending.map(k => {
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
      const pieData: PieData = chartData.map(data => ({
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
      const style = getComputedStyle(this.chartEl);
      const color = style.getPropertyValue('--primary') ?? '#000';
      const maskColor = style.getPropertyValue('--card-bg') ?? 'rgb(255 255 255 / 80%)';
      this.myChart.showLoading({ text: '', color, maskColor, spinnerRadius: 10, lineWidth: 2 });
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
          ...(this.dark ? { textStyle: { color: 'rgb(255 255 255 / 54%)' } } : {}),
        },
      });
    }
  }

  resize(isNarrow: boolean) {
    if (this.myChart) {
      this.myChart.resize();
    }
    this.setData(this.input, this.visualisation, this.rules, isNarrow, this.dataType);
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
    const formatter = (value: unknown) => value;
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
    valueFormatter: (val1: number, val2?: boolean) => unknown,
    isNarrow: boolean,
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
          formatter: (args: { data: { value: unknown; name: string } }) => {
            const value = valueFormatter(args.data.value as number);
            return `${args.data.name}\n${value}`;
          },
          ...(this.dark ? { textStyle: { color: '#fff' } } : {}),
        },
      },
    ];
    const legend = {
      type: 'scroll',
      orient: isNarrow ? 'horizontal' : 'vertical',
      left: 'left',
      bottom: isNarrow ? 0 : undefined,
      ...(this.dark ? { textStyle: { color: '#fff' } } : {}),
    };
    this.myChart.setOption({ ...this.getPieOptions(), series, legend });
    this.myChart.hideLoading();
  }

  private createOccBarChart(chartData: ChartData) {
    const name = 'Occurrences';
    const formatter = (value: unknown) => value;
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
    valueFormatter: (val1: number, val2?: boolean) => unknown,
  ) {
    // For some reason echarts draws the bars in the reverse order of the data
    chartData = chartData.reverse();

    const keys = chartData.map(x => x.key);
    const yAxis = {
      type: 'category',
      axisLine: { show: false },
      axisLabel: { show: true, ...(this.dark ? { color: '#fff' } : {}) },
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
          formatter: (args: { data: { value: number } }) => {
            return valueFormatter(args.data.value);
          },
        },
        data: chartData.map(x => x.val),
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
