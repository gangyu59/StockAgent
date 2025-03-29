var StockDB = (function () {
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
        /**
         * 保存股票数据。根据类型生成不同的 key：
         * - 'OVERVIEW' 类型：生成 "SYMBOL_OVERVIEW"
         * - 'TECHNICAL_INDICATOR' 类型：生成 "SYMBOL_TECHNICAL_INDICATOR"
         * - 其他类型（默认）：生成 "SYMBOL_TIME_SERIES"
         */
async saveStockData(symbol, data, type = 'daily') {
    try {
        // 1. 移除 symbol 末尾已存在的后缀
        const baseSymbol = symbol
            .toUpperCase()
            .replace(/_(TECHNICAL_INDICATOR|OVERVIEW|TIME_SERIES)$/i, '');

        // 2. 根据 type 加后缀
        const t = type.toUpperCase();
        let suffix = 'TIME_SERIES';
        if (t === 'OVERVIEW') {
            suffix = 'OVERVIEW';
        } else if (t === 'TECHNICAL_INDICATOR') {
            suffix = 'TECHNICAL_INDICATOR';
        }
        const formattedSymbol = `${baseSymbol}_${suffix}`;

        console.log(`[DB] 删除旧记录: ${formattedSymbol}`);
        await _executeTransaction('readwrite', 'delete', formattedSymbol);

        const record = {
            symbol: formattedSymbol,
            data: data,
            type: type,
            lastUpdated: new Date().toISOString()
        };

 //       console.log('[DB] 保存记录:', record);
        await _executeTransaction('readwrite', 'put', record);
        console.log('[DB] 保存成功:', formattedSymbol);

    } catch (error) {
        console.error('[DB] 保存失败:', error);
        throw error;
    }
},

async loadStockData(symbol, type = 'TIME_SERIES') {
    // 1. 移除 symbol 末尾已存在的后缀
    const baseSymbol = symbol
        .toUpperCase()
        .replace(/_(TECHNICAL_INDICATOR|OVERVIEW|TIME_SERIES)$/i, '');

    // 2. 根据 type 加后缀
    const t = type.toUpperCase();
    let suffix = 'TIME_SERIES';
    if (t === 'OVERVIEW') {
        suffix = 'OVERVIEW';
    } else if (t === 'TECHNICAL_INDICATOR') {
        suffix = 'TECHNICAL_INDICATOR';
    }
    const formattedSymbol = `${baseSymbol}_${suffix}`;

    const result = await _executeTransaction('readonly', 'get', formattedSymbol);
    console.log(`[DEBUG] 查询请求: ${formattedSymbol}, 命中: ${result ? '是' : '否'}`);
    return result || null;
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
                throw new Error(`数据格式错误：${symbol} 的时间序列不是数组类型`);
            }

            const formattedData = seriesData.map(item => ({
                date: item.date ? new Date(item.date) : new Date(),
                open: parseFloat(item.open) || 0,
                high: parseFloat(item.high) || 0,
                low: parseFloat(item.low) || 0,
                close: parseFloat(item.close) || 0,
                volume: parseInt(item.volume) || 0
            })).sort((a, b) => a.date - b.date);

//            console.log("格式化完成，样本数据:", formattedData.slice(0, 3));
            return formattedData;
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