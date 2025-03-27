window.chartRenderer = (function() {
    let chart = null;
    let candleSeries = null;

    return {
        initChart: function() {
            const container = document.getElementById('chart-container');
            if (!container) {
                console.error('图表容器未找到');
                return;
            }

            // 清空旧图表（如果存在）
            container.innerHTML = '';

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
				    priceScale: {
				        borderVisible: false,
				    },
				});

				candleSeries = chart.addCandlestickSeries(); // 现在这句不会报错
        },

        updateChart: function(symbol, formattedData) {
            if (!chart || !candleSeries) {
                this.initChart();
            }

            // 转换数据为 Lightweight Charts 所需格式
            const chartData = formattedData.map(item => ({
                time: Math.floor(new Date(item.date).getTime() / 1000), // 转为秒级 UNIX 时间戳
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close)
            }));

            console.log('[chartRenderer] 渲染数据样本:', chartData.slice(0, 3));

            candleSeries.setData(chartData);
        },

        showError: function(msg) {
            const container = document.getElementById('chart-container');
            if (container) {
                container.innerHTML = `<div style="color: red; padding: 20px;">${msg}</div>`;
            }
        }
    };
})();