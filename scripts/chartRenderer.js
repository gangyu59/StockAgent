//scripts/chartRenderer.js

window.chartRenderer = (function () {
    let chart = null;
    let candleSeries = null;
    let volumeSeries = null;

    return {
        initChart: function () {
            const container = document.getElementById('chart-tab');
            if (!container) {
                console.error('图表容器未找到');
                return;
            }

            container.innerHTML = ''; // 清空旧内容

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

            candleSeries = chart.addCandlestickSeries({
                priceScaleId: 'right',
            });

            volumeSeries = chart.addHistogramSeries({
                priceScaleId: 'volume',
                color: '#26a69a',
                priceFormat: {
                    type: 'volume',
                },
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

        resizeChart: function () {
            if (chart) {
                const container = document.getElementById('chart-tab');
                chart.resize(container.clientWidth, 400);
            }
        },

        showError: function (msg) {
            const container = document.getElementById('chart-tab');
            container.innerHTML = `<div style="color: red; padding: 20px;">${msg}</div>`;
        }
    };
})();