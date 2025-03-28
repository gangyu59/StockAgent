window.chartRenderer = (function () {
    let chart = null;
    let candleSeries = null;
    let volumeSeries = null;
    let barChart = null; // 用于销毁旧的 bar chart

    return {
        initChart: function () {
            const container = document.getElementById('chart-container'); // 注意 ID 是 chart-container
            if (!container) {
                console.error('图表容器未找到');
                return;
            }

            container.innerHTML = ''; // 清空旧图表

            chart = LightweightCharts.createChart(container, {
                width: container.clientWidth,
                height: 400,
                layout: {
                    background: { color: '#ffffff' },
                    textColor: '#000',
                },
                grid: {
                    vertLines: { color: '#eee' },
                    horzLines: { color: '#eee' },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                    borderVisible: false,
                },
                crosshair: {
                    mode: LightweightCharts.CrosshairMode.Normal
                },
                rightPriceScale: {
                    scaleMargins: {
                        top: 0.1,
                        bottom: 0.25,
                    },
                },
            });

            candleSeries = chart.addCandlestickSeries({ priceScaleId: 'right' });

            volumeSeries = chart.addHistogramSeries({
                priceScaleId: 'volume',
                color: '#26a69a',
                priceFormat: { type: 'volume' },
                scaleMargins: {
                    top: 0.75,
                    bottom: 0,
                },
            });

            chart.priceScale('volume').applyOptions({
                scaleMargins: {
                    top: 0.75,
                    bottom: 0,
                },
            });
        },

        updateChart: function (symbol, formattedData) {
            if (!chart || !candleSeries) {
                this.initChart();
            }

            const chartData = formattedData.map(item => ({
                time: Math.floor(new Date(item.date).getTime() / 1000),
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close)
            }));

            const volumeData = formattedData.map(item => ({
                time: Math.floor(new Date(item.date).getTime() / 1000),
                value: parseFloat(item.volume),
                color: item.close > item.open ? '#26a69a' : '#ef5350'
            }));

            candleSeries.setData(chartData);
            volumeSeries.setData(volumeData);
            chart.timeScale().fitContent();
        },

renderBarChart: async function (symbol) {
    const overviewData = await StockDB.loadStockData(symbol, 'OVERVIEW');
    if (!overviewData || !overviewData.data) {
        console.warn('无 overview 数据');
        return;
    }

    const d = overviewData.data;

    // 取值并做合法性和单位处理
    const safeRatio = (num) => {
        const n = parseFloat(num);
        return isNaN(n) ? 0 : n;
    };

    const safeDiv = (a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        return (!isNaN(numA) && !isNaN(numB) && numB !== 0) ? numA / numB : 0;
    };

const metrics = [
  {
    label: '收入增长率（YOY）',
    value: parseFloat(d.QuarterlyRevenueGrowthYOY) || 0
  },
  {
    label: '净利润率',
    value: parseFloat(d.ProfitMargin) || 0
  },
  {
    label: '毛利率',
    value: d.GrossProfitMargin
      ? parseFloat(d.GrossProfitMargin)
      : parseFloat(d.GrossProfitTTM / d.RevenueTTM) || 0
  },
  {
    label: 'ROE',
    value: parseFloat(d.ReturnOnEquityTTM) || 0
  }
];

    const canvas = document.getElementById('metrics-chart');
    if (!canvas) {
        console.warn('找不到 metrics-chart canvas 元素');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (barChart) {
        barChart.destroy();
    }

    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: metrics.map(m => m.label),
            datasets: [{
                label: '核心财务指标（%）',
                data: metrics.map(m => m.value),
                backgroundColor: '#4CAF50',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => (ctx.raw * 100).toFixed(2) + '%'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => (value * 100).toFixed(1) + '%'
                    }
                }
            }
        }
    });
},

        resizeChart: function () {
            if (chart) {
                const container = document.getElementById('chart-container');
                chart.resize(container.clientWidth, 400);
            }
        },

        showError: function (msg) {
            const container = document.getElementById('chart-tab');
            container.innerHTML = `<div style="color: red; padding: 20px;">${msg}</div>`;
        }
    };
})();