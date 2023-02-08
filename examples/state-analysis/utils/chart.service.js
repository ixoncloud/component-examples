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

import { mapValueToRuleIndex } from '../utils';
import { durationToformattedTimeStamp } from '../utils/time-format';

export class ChartService {
  myChart;
  input;
  visualisation;
  rules;
  dataType;

  constructor(chartEl) {
    this.chartEl = chartEl;
    this.myChart = echarts.init(this.chartEl);
    this.visualisation = '';
    this.rules = [];
    this.dataType = '';
  }

  getBarOptions() {
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
  getPieOptions() {
    return {
      legend: {
        type: 'scroll',
        orient: 'vertical',
      },
      series: [],
    };
  }

  setData(input, visualisation, rules, isNarrow, dataType) {
    this.input = input;
    this.visualisation = visualisation;
    this.rules = rules;
    this.dataType = dataType;

    const array = Object.keys(input).map((k) => input[k]);
    const largestValue = array.sort((a, b) => a - b)[array.length - 1];

    const chartData = Object.keys(input).map((k) => {
      const rule = mapValueToRuleIndex(k, rules);
      const position = largestValue / 4 > input[k] ? 'right' : 'inside';
      const val = {
        value: dataType === 'durations' ? input[k] / 1000 : input[k],
        label: { position },
      };
      if (rule !== -1) {
        val.itemStyle = { color: rules[rule].rule.color };
        val.name = rules[rule].rule.name;
      } else {
        val.name = k;
      }
      return {
        key: val.name,
        val,
      };
    });

    if (visualisation === 'bars') {
      if (dataType === 'occurrences') {
        this._createOccChart(chartData);
      } else if (dataType === 'durations') {
        this._createDurChart(chartData);
      }
    } else if (visualisation === 'pie') {
      const pieData = chartData.map((data) => ({
        value: data.val.value,
        name: data.key,
        itemStyle: data.val.itemStyle,
      }));
      if (dataType === 'occurrences') {
        this._createOccPie(pieData, isNarrow);
      } else if (dataType === 'durations') {
        this._createDurPie(pieData, isNarrow);
      }
    }
  }

  showLoading() {
    if (this.myChart) {
      this.myChart = echarts.init(this.chartEl);
      this.myChart.showLoading();
    }
  }

  showError() {
    if (this.myChart) {
      this.myChart = echarts.init(this.chartEl);
      this.myChart.hideLoading();
      this.myChart.clear();
      this.myChart.setOption({
        title: {
          show: true,
          text: 'Error check your inputs',
          left: 'center',
          top: 'middle',
        },
      });
    }
  }

  resize(isNarrow) {
    if (this.myChart) {
      this.myChart.resize();
    }
    if (this.dataType === 'occurrences') {
      this.setData(
        this.input,
        this.visualisation,
        this.rules,
        isNarrow,
        'occurrences'
      );
    } else if (this.dataType === 'duration') {
      this.setData(
        this.input,
        this.visualisation,
        this.rules,
        isNarrow,
        'durations'
      );
    }
  }

  _createOccPie(pieData, isNarrow) {
    const name = 'Occurrences';
    const formatter = (value) => value;
    this._createPieChart(pieData, name, formatter, isNarrow);
  }

  _createDurPie(pieData, isNarrow) {
    const name = 'Duration';
    const formatter = durationToformattedTimeStamp;
    this._createPieChart(pieData, name, formatter, isNarrow);
  }

  _createPieChart(chartData, chartName, valueFormatter, isNarrow) {
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
          formatter: (args) => {
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
    this.myChart = echarts.init(this.chartEl);
    this.myChart.setOption({ ...this.getPieOptions(), series, legend });
    this.myChart.hideLoading();
  }

  _createOccChart(chartData, isNarrow) {
    const name = 'Occurrences';
    const formatter = (value) => value;
    this._createBarChart(chartData, name, formatter, isNarrow);
  }

  _createDurChart(chartData, isNarrow) {
    const name = 'Duration';
    const formatter = durationToformattedTimeStamp;
    this._createBarChart(chartData, name, formatter, isNarrow);
  }

  _createBarChart(chartData, chartName, valueFormatter) {
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
          formatter: (args) => {
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
    this.myChart = echarts.init(this.chartEl);
    this.myChart.setOption({
      ...this.getBarOptions(),
      xAxis,
      yAxis,
      series,
    });
    this.myChart.hideLoading();
  }
}
