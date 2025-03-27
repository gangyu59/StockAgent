// scripts/stockManager.js
window.stockManager = {
    // 从输入框获取股票代码
    getStockCode: function() {
        const inputElement = document.getElementById('stock-code');
        if (!inputElement) {
            console.error('Error: stock-code input element not found!');
            return null;
        }
        
        const stockCode = inputElement.value.trim().toUpperCase();
        return this.isValidStockCode(stockCode) ? stockCode : null;
    },
    
    // 加载股票清单
    loadStockList: function() {
        try {
            return JSON.parse(localStorage.getItem('stockList')) || [];
        } catch (e) {
            console.error('解析股票列表失败:', e);
            return [];
        }
    },

    // 保存股票清单
    saveStockList: function(stockList) {
        if (!Array.isArray(stockList)) {
            console.error('保存的股票清单必须是数组');
            return;
        }
        localStorage.setItem('stockList', JSON.stringify(stockList));
    },

    // 渲染股票清单
    renderStockList: function(stockList) {
        const listElement = document.getElementById('stock-list');
        const expandedList = document.getElementById('expanded-stock-list');
        if (!listElement || !expandedList) return;

        const escapeHTML = str => str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag]));

        // 显示最新一个股票
        listElement.innerHTML = stockList.length > 0
            ? `<li>${escapeHTML(stockList[stockList.length - 1])} <button class="delete-stock">×</button></li>`
            : '';

        // 显示所有股票
				expandedList.innerHTML = stockList.map(stock => `
				    <li class="stock-item" data-symbol="${escapeHTML(stock)}">
				        ${escapeHTML(stock)}
				        <button class="delete-stock">×</button>
				    </li>
				`).join('');
				
				// 添加点击事件：点击股票 → 显示在输入框
				Array.from(expandedList.querySelectorAll('li.stock-item')).forEach(li => {
				    li.addEventListener('click', (e) => {
				        // 如果点击的是删除按钮就跳过
				        if (e.target.classList.contains('delete-stock')) return;
				
				        const symbol = li.dataset.symbol;
				        const inputEl = document.getElementById('stock-code');
				        if (inputEl && symbol) {
				            inputEl.value = symbol;
				        }
				    });
				});
    },

    // 添加股票到清单
    addStock: function(stockCode) {
        if (!this.isValidStockCode(stockCode)) return false;
        
        const stockList = this.loadStockList();
        const normalizedCode = stockCode.toUpperCase();
        
        if (!stockList.includes(normalizedCode)) {
            stockList.push(normalizedCode);
            this.saveStockList(stockList);
            this.renderStockList(stockList);
            return true;
        }
        return false;
    },

    // 删除股票
    deleteStock: function(stockCode) {
        const stockList = this.loadStockList();
        const index = stockList.indexOf(stockCode);
        
        if (index !== -1) {
            stockList.splice(index, 1);
            this.saveStockList(stockList);
            this.renderStockList(stockList);
            return true;
        }
        return false;
    },

    // 获取选中的股票
    getSelectedStocks: function() {
        return Array.from(document.querySelectorAll('#expanded-stock-list li.selected'))
            .map(li => li.dataset.symbol || li.textContent.replace('×', '').trim())
            .filter(Boolean);
    },
    
    // 获取图表数据
    fetchStockData: async function(stockCode) {
        if (!this.isValidStockCode(stockCode)) {
            console.error('Invalid stock code:', stockCode);
            return null;
        }

        // 内存缓存检查
        if (this._cache && this._cache[stockCode]) {
            return this._cache[stockCode];
        }

        try {
            const data = await new Promise((resolve) => {
                StockDB.getFormattedStockData(stockCode, (err, data) => {
                    if (err || !data) {
                        console.error(`获取${stockCode}数据失败:`, err);
                        resolve(null);
                    } else {
                        // 写入缓存
                        this._cache = this._cache || {};
                        this._cache[stockCode] = data;
                        resolve(data);
                    }
                });
            });
            
            return data;
        } catch (error) {
            console.error('数据获取异常:', error);
            return null;
        }
    },
    
    // 验证股票代码
    isValidStockCode: function(code) {
        return typeof code === 'string' && 
               code.length >= 1 && 
               code.length <= 5 && 
               /^[A-Z0-9]+$/.test(code); // 允许数字（如港股代码）
    },
    
    // 清空缓存（新增）
    clearCache: function() {
        this._cache = null;
    }
};