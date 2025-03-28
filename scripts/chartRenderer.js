window.chartRenderer = (function() {
    let chart = null;
    let candleSeries = null;

    return {
        initChart: function() {
				    const container = document.querySelector('#chart-tab #chart-container');
				    if (!container) {
				        console.error('[chartRenderer] 图表容器未找到');
				        return;
				    }
				
	//			    console.log('[chartRenderer] initChart 被调用');
	//			    console.log('chart container 宽度:', container.clientWidth);
				
				    container.innerHTML = ''; // 清空旧图
				
				    // 延迟强制等渲染完毕再创建图表
				    setTimeout(() => {
				        const width = container.clientWidth || 300; // 若仍为0，提供默认值
				        const height = container.clientHeight || 400;
				
				        chart = LightweightCharts.createChart(container, {
				            width: width,
				            height: height,
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
				
				        candleSeries = chart.addCandlestickSeries();
				
				        // 自动适应窗口大小变化
				        window.addEventListener('resize', () => {
				            chart.resize(container.clientWidth, container.clientHeight);
				        });
				
		//		        console.log('[chartRenderer] 图表已初始化');
				    }, 100);
				},
				
				updateChart: function(symbol, formattedData) {
				    const container = document.querySelector('#chart-tab #chart-container');
				    if (!container) {
				        console.error('[chartRenderer] 容器不存在，取消更新图表');
				        return;
				    }
				
				    // 激活蜡烛图 tab
				    document.querySelectorAll('.tab-btn').forEach(btn => {
				        btn.classList.toggle('active', btn.dataset.tab === 'chart-tab');
				    });
				    document.querySelectorAll('.tab-content').forEach(tab => {
				        tab.classList.toggle('active', tab.id === 'chart-tab');
				    });
				
				    // 延迟 50ms，等 DOM 渲染完再初始化图表
				    setTimeout(() => {
				        // 初始化图表
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
				
				        console.log('[chartRenderer] 渲染数据样本:', chartData.slice(0, 3));
				        candleSeries.setData(chartData);
				    }, 500);
				},

        showError: function(msg) {
            const container = document.querySelector('#chart-tab #chart-container');
            if (container) {
                container.innerHTML = `<div style="color: red; padding: 20px;">${msg}</div>`;
            }
        }
    };
})();