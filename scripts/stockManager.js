// stockManager.js

// 将函数挂载到 window 对象
window.stockManager = {
    // 加载股票清单
    loadStockList: function () {
        const stockList = JSON.parse(localStorage.getItem('stockList')) || [];
        return stockList;
    },

    // 保存股票清单
    saveStockList: function (stockList) {
        localStorage.setItem('stockList', JSON.stringify(stockList));
    },

    // 渲染股票清单
    renderStockList: function (stockList) {
        const listElement = document.getElementById('stock-list');
        const expandedList = document.getElementById('expanded-stock-list');
        if (!listElement || !expandedList) {
            console.error('Error: stock-list or expanded-stock-list element not found!');
            return;
        }

        // 显示最新一个股票
        listElement.innerHTML = stockList.length > 0
            ? `<li>${stockList[stockList.length - 1]} <button class="delete-stock">×</button></li>`
            : '';

        // 显示所有股票
        expandedList.innerHTML = stockList.map(stock => `
            <li>
                ${stock}
                <button class="delete-stock">×</button>
            </li>
        `).join('');
    },

    // 添加股票到清单
    addStock: function (stockCode) {
        const stockList = this.loadStockList();
        if (stockCode && !stockList.includes(stockCode)) {
            stockList.push(stockCode);
            this.saveStockList(stockList);
            this.renderStockList(stockList);
        }
    },

    // 删除股票
    deleteStock: function (stockCode) {
        let stockList = this.loadStockList();
        const index = stockList.indexOf(stockCode);
        if (index !== -1) {
            stockList.splice(index, 1);
            this.saveStockList(stockList);
            this.renderStockList(stockList);
        }
    },

    // 获取选中的股票
    getSelectedStocks: function () {
        return Array.from(document.querySelectorAll('#expanded-stock-list li.selected'))
            .map(li => li.textContent.replace('×', '').trim());
    }
};