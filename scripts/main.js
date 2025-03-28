// script/main.js

// 显示消息
function showMessage(message) {
    alert(message);
}

/*
// 在应用初始化时调用（如main.js/入口文件）
(async function init() {
    await clearDatabase(); // 先清库
    // 然后继续其他初始化
})();
*/

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const stockList = window.stockManager.loadStockList(); // 加载股票清单
    window.stockManager.renderStockList(stockList);

    // 添加股票到清单
    document.getElementById('add-stock').addEventListener('click', () => {
        const stockCode = document.getElementById('stock-code').value.trim().toUpperCase();
        if (stockCode) {
            window.stockManager.addStock(stockCode);
        }
    });

    // 展开/收缩股票清单
    const toggleIcon = document.getElementById('toggle-icon');
    const expandedList = document.getElementById('expanded-stock-list');
    toggleIcon.addEventListener('click', () => {
        if (expandedList.style.display === 'none') {
            expandedList.style.display = 'block';
            toggleIcon.innerHTML = '<i class="fas fa-chevron-up"></i>'; // 收缩 icon
        } else {
            expandedList.style.display = 'none';
            toggleIcon.innerHTML = '<i class="fas fa-chevron-down"></i>'; // 展开 icon
        }
    });

    // 删除股票
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-stock')) {
            const stockCode = event.target.parentElement.textContent.replace('×', '').trim();
            window.stockManager.deleteStock(stockCode);
        }
    });

    // 选择股票
    document.getElementById('expanded-stock-list').addEventListener('click', (event) => {
        const target = event.target;
        if (target.tagName === 'LI') {
            target.classList.toggle('selected'); // 切换选中状态
        }
    });

    // 获取数据
    document.getElementById('fetch-data').addEventListener('click', () => {
        const stockCode = window.stockManager.getStockCode();
        if (stockCode) {
					  // 切换到基础信息 tab
			      switchToTab('overview-tab');
							
            fetchStockData(stockCode);
        } else {
            showMessage('请输入有效的股票代码（1-5个字母）');
        }
    });

    // 搜索新闻按钮点击事件
    document.getElementById('search-news').addEventListener('click', () => {
        const stockCode = window.stockManager.getStockCode();
        if (stockCode) {
					   	// 切换到新闻 tab
			        switchToTab('news-tab');
            window.newsSearch.searchStockNews(stockCode);
        } else {
            showMessage('请输入有效的股票代码（1-5个字母）');
        }
    });

    // 初始化图表
    window.chartRenderer.initChart();
    
		// 修改后的read-report事件处理
		document.getElementById('read-report').addEventListener('click', async function() {
		    const stockCode = window.stockManager.getStockCode();
		    const debugEl = document.getElementById('debug-area');
//		    debugEl.innerHTML = `正在获取 ${stockCode} 数据...`;
		    
		    try {
						// 切换到蜡烛图 tab
			      switchToTab('chart-tab');
						
		//        console.group('=== 开始数据获取流程 ===');
		        
		        // 第一步：直接从数据库加载原始数据
		        const dbData = await StockDB.loadStockData(stockCode);
		        
		        if (!dbData) {
		            throw new Error('数据库中没有找到该股票的数据');
		        }
		
		        const formattedData = await StockDB.getFormattedStockData(stockCode);
	//	        console.log('4. 格式化后的数据样本:', formattedData.slice(0, 3)); // 显示前3条
		        
	//	        debugEl.innerHTML += `<br>获取到 ${formattedData.length} 条数据`;
		        
		        if (formattedData && formattedData.length) {
		            window.chartRenderer.updateChart(stockCode, formattedData);
		        } else {
		            const msg = '错误：格式化后数据为空';
		            console.error(msg);
		     //       debugEl.innerHTML += `<br>${msg}`;
		            window.chartRenderer.showError(msg);
		        }
		        
		        console.groupEnd();
		    } catch (error) {
		        console.error('完整错误堆栈:', error);
		        console.log('当前数据库状态:', await StockDB.getAllSymbols());
		        
		        debugEl.innerHTML += `<br>发生错误: ${error.message}`;
		        window.chartRenderer.showError(`数据加载失败: ${error.message}`);
		    }
		});
});


document.getElementById('ai-analysis').addEventListener('click', async function () {
    const stockCode = window.stockManager.getStockCode();
    const debugEl = document.getElementById('debug-area');
//    debugEl.innerHTML = `正在生成 ${stockCode} 的 AI 分析报告...`;
		
		toggleHourglass(true);

    try {
        // 切换到 AI 分析 tab
			  switchToTab('ai-tab');

        const result = await window.aiAnalysis.analyze(stockCode);
        window.reportGenerator.renderAIReport(result);
   //     debugEl.innerHTML += `<br>报告生成完成`;
    } catch (err) {
        console.error('[AI 分析失败]', err);
        debugEl.innerHTML += `<br>发生错误: ${err.message || '未知错误'}`;
        document.getElementById('ai-tab').innerHTML = `<div style="color: red;">AI 分析失败：${err.message}</div>`;
    }
		toggleHourglass(false);
});

function generateStockReport(data) {
    console.log('Generating report for:', data);
    // 生成研究报告
}

//切换tab
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // 激活按钮
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 激活内容页
    const targetId = btn.getAttribute('data-tab');
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.getElementById(targetId).classList.add('active');
  });
});