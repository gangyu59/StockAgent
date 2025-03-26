// script/main.js

// 显示消息
function showMessage(message) {
    alert(message);
}

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
            fetchStockData(stockCode);
        } else {
            showMessage('请输入有效的股票代码（1-5个字母）');
        }
    });

    // 搜索新闻按钮点击事件
    document.getElementById('search-news').addEventListener('click', () => {
        const stockCode = window.stockManager.getStockCode();
        if (stockCode) {
            window.newsSearch.searchStockNews(stockCode);
        } else {
            showMessage('请输入有效的股票代码（1-5个字母）');
        }
    });

    // AI 推选
    document.getElementById('ai-recommend').addEventListener('click', () => {
        const stockCode = window.stockManager.getSelectedStocks();
        if (stockCode) {
            analyzeStockWithAI(stockCode);
        } else {
            showMessage('请输入有效的股票代码（1-5个字母）');
        }
    });

    // 初始化图表
    window.chartRenderer.initChart();
    
    // 修改阅读报告按钮事件
		document.getElementById('read-report').addEventListener('click', async function() {
		    const stockCode = window.stockManager.getStockCode();
		    const debugEl = document.getElementById('debug-area');
		    debugEl.innerHTML = `正在获取 ${stockCode} 数据...`;
		    
		    try {
		        const data = await window.stockManager.fetchStockData(stockCode);
		        debugEl.innerHTML += `<br>获取到 ${data?.length || 0} 条数据`;
		        
		        if (data?.length) {
		            window.chartRenderer.updateChart(stockCode, data);
		        } else {
		            debugEl.innerHTML += `<br>错误：数据为空`;
		        }
		    } catch (error) {
		        debugEl.innerHTML += `<br>发生错误: ${error.message}`;
		    }
		});
});



function analyzeStockWithAI(stockCodes) {
    console.log('Analyzing stocks with AI:', stockCodes);
    // 调用 AI API 进行分析
}

function generateStockReport(data) {
    console.log('Generating report for:', data);
    // 生成研究报告
}