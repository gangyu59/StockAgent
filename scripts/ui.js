// ui.js

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
        const selectedStocks = window.stockManager.getSelectedStocks();
        if (selectedStocks.length > 0) {
            fetchStockData(selectedStocks);
        } else {
            showMessage('请先添加股票代码！');
        }
    });

    // 搜索新闻按钮点击事件
    document.getElementById('search-news').addEventListener('click', () => {
        const selectedStocks = window.stockManager.getSelectedStocks();
        if (selectedStocks.length > 0) {
            window.newsSearch.searchStockNews(selectedStocks);
        } else {
            showMessage('请先添加股票代码！');
        }
    });

    // AI 推选
    document.getElementById('ai-recommend').addEventListener('click', () => {
        const selectedStocks = window.stockManager.getSelectedStocks();
        if (selectedStocks.length > 0) {
            analyzeStockWithAI(selectedStocks);
        } else {
            showMessage('请先添加股票代码！');
        }
    });

    // 阅读报告
    document.getElementById('read-report').addEventListener('click', () => {
        const selectedStocks = window.stockManager.getSelectedStocks();
        if (selectedStocks.length > 0) {
            generateStockReport({ stockCode: selectedStocks[0] });
        } else {
            showMessage('请先添加股票代码！');
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