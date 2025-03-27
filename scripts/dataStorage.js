var StockDB = (function() {
    const DB_CONFIG = {
        name: 'StockDataDB_v2',
        version: 1,
        storeName: 'stock_data',
        keyPath: 'symbol'
    };

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

    async function _executeTransaction(mode, operation, data) {
        let db;
        try {
            db = await _getDatabase();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(DB_CONFIG.storeName, mode);
                tx.onerror = (event) => {
                    console.error('[DB] 事务失败:', event.target.error);
                    db.close();
                    reject(event.target.error);
                };

                const store = tx.objectStore(DB_CONFIG.storeName);
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
                    db.close();
                    resolve(request.result);
                };

                request.onerror = (event) => {
                    console.error('[DB] 操作失败:', event.target.error);
                    db.close();
                    reject(event.target.error);
                };
            });
        } catch (err) {
            if (db) db.close();
            console.error('[DB] 执行事务异常:', err);
            throw err;
        }
    }

    return {
				async saveStockData(symbol, data, type = 'daily') {
				    try {
				        const upperSymbol = symbol.toUpperCase();
				        const formattedSymbol = `${upperSymbol}_TIME_SERIES`;
				
				        const record = {
				            symbol: formattedSymbol,
				            data: data,
				            type: type,
				            lastUpdated: new Date().toISOString()
				        };
				
				        console.log('[DB] 准备保存记录:', {
				            symbol: formattedSymbol,
				            dataLength: Array.isArray(data?.history) ? data.history.length : 'unknown',
				            type: type
				        });
				
				        await _executeTransaction('readwrite', 'put', record);
				        console.log('[DB] 保存成功:', formattedSymbol);
				    } catch (error) {
				        console.error('[DB] 保存失败:', error);
				        throw error;
				    }
				},
				
				async loadStockData(symbol, type = 'TIME_SERIES') {
				    const upperSymbol = symbol.toUpperCase();
				    const allData = await _executeTransaction('readonly', 'getAll');
				
				    const matched = allData.find(item => {
				        const matchSymbol = item.symbol?.toUpperCase().includes(upperSymbol);
				        const matchType = item.type?.toUpperCase().includes(type.toUpperCase()) || item.symbol?.includes('TIME_SERIES');
				        return matchSymbol && matchType;
				    });
				
				    console.log(`[DEBUG] 查询请求: ${symbol}, 匹配结果: ${matched?.symbol || 'null'}`);
				    return matched || null;
				},

        async getFormattedStockData(symbol) {
            const dbData = await this.loadStockData(symbol, 'TIME_SERIES');
            if (!dbData || !dbData.data) {
                throw new Error(`未找到 ${symbol} 的时间序列数据`);
            }

            let seriesData;

            if (Array.isArray(dbData.data)) {
                console.log("✅ 使用直接数组格式");
                seriesData = dbData.data;
            } else if (dbData.data.history) {
                console.log("✅ 使用 history 字段格式");
                seriesData = dbData.data.history;
            } else if (dbData.data['Time Series (Daily)']) {
                console.log("✅ 使用原始 API 格式");
                seriesData = Object.entries(dbData.data['Time Series (Daily)']).map(([date, values]) => ({
                    date,
                    open: values['1. open'],
                    high: values['2. high'],
                    low: values['3. low'],
                    close: values['4. close'],
                    volume: values['6. volume']
                }));
            } else {
                console.warn("⚠️ 未知格式，尝试使用兜底数据结构");
                seriesData = dbData.data;
            }

            if (!Array.isArray(seriesData)) {
                const actualType = typeof seriesData;
                console.error(`[格式错误] seriesData 类型应为 Array，实际为: ${actualType}`, seriesData);
                throw new Error(`数据格式错误：${symbol} 的时间序列不是数组类型`);
            }

            const formattedData = seriesData.map(item => {
                console.log("Processing item:", {
                    rawDate: item.date,
                    rawOpen: item.open,
                    rawType: typeof item.open
                });

                const result = {
                    date: item.date ? new Date(item.date) : new Date(),
                    open: convertToNumber(item.open),
                    high: convertToNumber(item.high),
                    low: convertToNumber(item.low),
                    close: convertToNumber(item.close),
                    volume: convertToNumber(item.volume)
                };

                if (isNaN(result.open)) {
                    console.warn("数值转换警告:", {
                        symbol,
                        rawValue: item.open,
                        converted: result.open
                    });
                }

                return result;
            }).sort((a, b) => a.date - b.date);

            console.log("格式化完成，样本数据:", formattedData.slice(0, 3));
            return formattedData;

            function convertToNumber(value) {
                if (typeof value === 'number') return value;
                if (typeof value === 'string') {
                    const cleaned = value.replace(/[^\d.-]/g, '');
                    return parseFloat(cleaned) || 0;
                }
                return 0;
            }
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