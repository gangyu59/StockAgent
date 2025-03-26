// scripts/dataStorage.js
var StockDB = (function() {
    // 数据库配置
    const DB_CONFIG = {
        name: 'StockDataDB_v2',  // 新数据库名避免冲突
        version: 1,
        storeName: 'stock_data',
        keyPath: 'symbol'
    };

    // 私有方法：初始化数据库连接
    function _getDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
                    const store = db.createObjectStore(DB_CONFIG.storeName, {
                        keyPath: DB_CONFIG.keyPath
                    });
                    store.createIndex('type', 'type', { unique: false });
                    console.log('Database store created');
                }
            };
        });
    }

    // 私有方法：执行数据库事务
		async function _executeTransaction(mode, operation, data) {
		    let db;
		    try {
		        // 1. 获取数据库连接（保持原有）
		        db = await _getDatabase();
		        
		        return new Promise((resolve, reject) => {
		            // 2. 添加事务错误监听（新增）
		            const tx = db.transaction(DB_CONFIG.storeName, mode);
		            tx.onerror = (event) => {
		                console.error('[DB] 事务失败:', event.target.error);
		                db.close(); // 确保关闭连接
		                reject(event.target.error);
		            };
		
		            const store = tx.objectStore(DB_CONFIG.storeName);
		            
		            // 3. 操作分发（保持您的原有逻辑）
		            let request;
		            switch (operation) {
		                case 'put': request = store.put(data); break;
		                case 'get': request = store.get(data); break;
		                case 'delete': request = store.delete(data); break;
		                case 'getAll': request = store.getAll(); break;
		                default: 
		                    db.close();
		                    return reject(new Error(`无效操作: ${operation}`));
		            }
		
		            request.onsuccess = () => {
		                if (operation === 'get' || operation === 'getAll') {
		                    console.log('[DB] 操作成功:', { 
		                        operation,
		                        dataSize: Array.isArray(request.result) 
		                            ? request.result.length 
		                            : 1
		                    });
		                }
		                db.close(); // 成功时关闭连接
		                resolve(request.result);
		            };
		            
		            request.onerror = (event) => {
		                console.error('[DB] 操作失败:', {
		                    operation,
		                    error: event.target.error,
		                    data: operation === 'put' ? data : null
		                });
		                db.close(); // 失败时关闭连接
		                reject(event.target.error);
		            };
		        });
		    } catch (err) {
		        // 4. 全局错误处理（新增）
		        if (db) db.close();
		        console.error('[DB] 执行事务异常:', err);
		        throw err;
		    }
		}

    return {
        /**
         * 保存股票数据
         * @param {string} symbol - 股票代码
         * @param {object} data - 要保存的数据
         * @param {string} type - 数据类型
         * @returns {Promise<void>}
         */
        async saveStockData(symbol, data, type = 'daily') {
				    try {
				        const record = {
				            symbol: symbol.toUpperCase(),
				            data: data,
				            type: type,
				            lastUpdated: new Date().toISOString()
				        };
				
				        console.log('[DB] 准备保存记录:', {  // 调试日志
				            symbol: symbol,
				            dataLength: Array.isArray(data?.history) ? data.history.length : 'unknown',
				            type: type
				        });
				
				        await _executeTransaction('readwrite', 'put', record);
				        console.log('[DB] 保存成功:', symbol);  // 成功日志
				    } catch (error) {
				        console.error('[DB] 保存失败:', {  // 详细错误日志
				            symbol: symbol,
				            error: error,
				            errorStack: error.stack,
				            time: new Date().toISOString()
				        });
				        throw error;  // 保持原有错误抛出
				    }
				},

        /**
         * 加载股票数据
         * @param {string} symbol - 股票代码
         * @returns {Promise<object|null>}
         */
        async loadStockData(symbol) {
            return await _executeTransaction('readonly', 'get', symbol.toUpperCase());
        },

        /**
         * 获取格式化后的时间序列数据
         * @param {string} symbol - 股票代码
         * @returns {Promise<Array>}
         */
        async getFormattedStockData(symbol) {
            const dbData = await this.loadStockData(symbol);
            if (!dbData || !dbData.data) {
                throw new Error('No data available');
            }

            // 数据格式兼容处理
            let seriesData;
            if (Array.isArray(dbData.data)) {
                seriesData = dbData.data;  // 格式1: 直接数组
            } else if (dbData.data.history) {
                seriesData = dbData.data.history;  // 格式2: 包含history字段
            } else if (dbData.data['Time Series (Daily)']) {
                // 格式3: 原始API格式
                seriesData = Object.entries(dbData.data['Time Series (Daily)']).map(([date, values]) => ({
                    date,
                    open: values['1. open'],
                    high: values['2. high'],
                    low: values['3. low'],
                    close: values['4. close'],
                    volume: values['6. volume']
                }));
            } else {
                seriesData = dbData.data;  // 最后尝试直接使用
            }

            // 统一格式化
            return seriesData.map(item => ({
                date: item.date ? new Date(item.date) : new Date(),
                open: parseFloat(item.open) || 0,
                high: parseFloat(item.high) || 0,
                low: parseFloat(item.low) || 0,
                close: parseFloat(item.close) || 0,
                volume: parseInt(item.volume) || 0
            })).sort((a, b) => a.date - b.date);
        },

        /**
         * 获取所有股票代码
         * @returns {Promise<Array>}
         */
        async getAllSymbols() {
            const allData = await _executeTransaction('readonly', 'getAll');
            return allData.map(item => ({
                symbol: item.symbol,
                type: item.type,
                lastUpdated: item.lastUpdated
            }));
        }
    };
})();


//下面是维护感兴趣的股票清单的函数
function saveStockList(stockList) {
    localStorage.setItem('stockList', JSON.stringify(stockList));
}

function loadStockList() {
    return JSON.parse(localStorage.getItem('stockList')) || [];
}