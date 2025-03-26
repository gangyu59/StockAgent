// scripts/dataFetching.js

// 获取股票基础信息
async function fetchStockOverview(stockCode) {
    const url = `${BASE_URL}?function=OVERVIEW&symbol=${stockCode}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching stock overview:', error);
        return null;
    }
}

async function fetchStockTimeSeries(stockCode) {
    const url = `${BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${stockCode}&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=compact`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data['Error Message']) throw new Error(data['Error Message']);
        
        const timeSeries = data['Time Series (Daily)'];
        if (!timeSeries) throw new Error('No time series data found');

        // 转换为数组并取最近10条
        return Object.keys(timeSeries)
            .sort()
            .reverse()
            .slice(0, 5)
            .map(date => ({
                date: date,
                open: timeSeries[date]['1. open'],
                high: timeSeries[date]['2. high'],
                low: timeSeries[date]['3. low'],
                close: timeSeries[date]['4. close'],
                volume: timeSeries[date]['6. volume']
            }));
    } catch (error) {
        console.error('获取数据失败:', error);
        throw error;
    }
}

// 保存数据到本地 JSON 文件
function saveDataToFile(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 将数据保存到IndexedDB（替代原saveDataToFile）
 * @param {Object} data - 要保存的股票数据
 * @param {string} symbol - 股票代码（替代原filename参数）
 * @param {function} [callback] - 可选回调函数(err)
 */
// 修改后的 saveDataToDB 函数
function saveDataToDB(data, symbol, callback) {
    // 强制验证输入
    if (!symbol || typeof symbol !== 'string') {
        return callback(new Error('股票代码必须是字符串'));
    }
    if (!Array.isArray(data)) {
        return callback(new Error('数据必须是数组'));
    }

    const dbName = 'StockDataDB';
    const dbVersion = 1; // 固定版本号
    
    const request = indexedDB.open(dbName, dbVersion);
    
    request.onerror = (e) => callback(e.target.error);
    
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('stock_data')) {
            const store = db.createObjectStore('stock_data', {
                keyPath: 'symbol'
            });
            store.createIndex('by_symbol', 'symbol', { unique: true });
        }
    };
    
    request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('stock_data', 'readwrite');
        const store = tx.objectStore('stock_data');
        
        const record = {
            symbol: symbol,
            data: { history: data },
            lastUpdated: new Date().toISOString()
        };
        
        const req = store.put(record);
        
        req.onsuccess = () => {
            db.close();
            callback(null);
        };
        
        req.onerror = (e) => {
            db.close();
            callback(e.target.error);
        };
    };
}

function saveDataToDB000(data, symbol, callback) {
    // 强制验证关键字段
    if (!symbol || typeof symbol !== 'string') {
        const err = new Error('无效的股票代码');
        console.error('❌ 数据验证失败:', err);
        return callback(err);
    }

    const request = indexedDB.open('StockDataDB', 1);
    
    request.onerror = (event) => {
        console.error('❌ 打开数据库失败:', event.target.error);
        callback(event.target.error);
    };

    request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction('stock_data', 'readwrite');
        const store = tx.objectStore('stock_data');

        // 确保记录包含必需的symbol字段
        const record = {
            symbol: String(symbol), // 强制转换为字符串
            data: { 
                history: Array.isArray(data) ? data : [data] 
            },
            lastUpdated: new Date().toISOString()
        };

        const req = store.put(record);
        
        req.onsuccess = () => {
            console.log('✅ 数据保存成功:', symbol);
            callback(null);
            db.close();
        };
        
        req.onerror = (event) => {
            console.error('❌ 存储操作失败:', {
                error: event.target.error,
                attemptedRecord: record // 打印尝试存储的记录
            });
            callback(event.target.error);
            db.close();
        };
    };

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('stock_data')) {
            db.createObjectStore('stock_data', { 
                keyPath: 'symbol' // 明确指定keyPath
            });
        }
    };
}


function saveDataToDB00(data, symbol, callback) {
    console.log('🚀 开始保存数据:', symbol, '数据量:', data.length);

    // 获取当前数据库版本
    const versionRequest = indexedDB.open('StockDataDB');
    versionRequest.onsuccess = (event) => {
        const db = event.target.result;
        const currentVersion = db.version;
        db.close();

        // 使用当前版本+1打开数据库
        const request = indexedDB.open('StockDataDB', currentVersion + 1);
        let isCallbackCalled = false;

        request.onerror = (event) => {
            if (!isCallbackCalled) {
                console.error('❌ 打开数据库失败:', event.target.error);
                callback(event.target.error);
                isCallbackCalled = true;
            }
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('stock_data')) {
                db.createObjectStore('stock_data', { keyPath: 'symbol' });
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction('stock_data', 'readwrite');
            const store = tx.objectStore('stock_data');

            const record = {
                symbol: symbol,
                data: { history: data },
                lastUpdated: new Date().toISOString()
            };

            const putRequest = store.put(record);
            
            putRequest.onsuccess = () => {
                if (!isCallbackCalled) {
                    console.log('✅ 数据保存成功:', symbol);
                    callback(null);
                    isCallbackCalled = true;
                }
            };
            
            putRequest.onerror = (event) => {
                if (!isCallbackCalled) {
                    console.error('❌ 保存数据失败:', event.target.error);
                    callback(event.target.error);
                    isCallbackCalled = true;
                }
            };
            
            tx.oncomplete = () => db.close();
        };
    };
}

function saveDataToDB0(data, symbol, callback) {
    console.log('🚀 开始保存数据:', symbol, '数据量:', data.length);
    
    const request = indexedDB.open('StockDataDB', 1);
    let isCallbackCalled = false;
    let db;  // 用于确保关闭连接

    // 保险机制：4秒超时（比外部的3秒长）
    const safetyTimeout = setTimeout(() => {
        if (!isCallbackCalled) {
            console.error('💥 数据库操作最终超时');
            isCallbackCalled = true;
            callback(new Error('数据库操作最终超时'));
            if (db) db.close();
        }
    }, 4000);

    request.onsuccess = (event) => {
        db = event.target.result;
        const tx = db.transaction('stock_data', 'readwrite');
        const store = tx.objectStore('stock_data');

        const record = {
            symbol: symbol,
            data: { history: data },
            lastUpdated: new Date().toISOString()
        };

        tx.oncomplete = () => {
            if (!isCallbackCalled) {
                clearTimeout(safetyTimeout);
                console.log('✅ 数据持久化完成:', symbol);
                isCallbackCalled = true;
                callback(null);
            }
            db.close();
        };

        tx.onerror = (event) => {
            if (!isCallbackCalled) {
                clearTimeout(safetyTimeout);
                console.error('❌ 事务错误:', event.target.error);
                isCallbackCalled = true;
                callback(event.target.error);
            }
            db.close();
        };

        store.put(record);
    };

    request.onerror = (event) => {
        if (!isCallbackCalled) {
            clearTimeout(safetyTimeout);
            console.error('❌ 打开数据库失败:', event.target.error);
            isCallbackCalled = true;
            callback(event.target.error);
        }
    };
}

function saveDataToDB0(data, symbol, callback) {
    console.log('开始保存数据到DB:', symbol, data);
    
    try {
        let isCallbackCalled = false;
        let timeout = setTimeout(() => {  // 新增：内部超时保险
            if (!isCallbackCalled) {
                console.error('⚠️ 数据库回调未及时执行');
                callback(new Error('数据库响应超时'));
            }
        }, 3500); // 比外部的3秒稍长

        StockDB.saveStockData(
            symbol,
            { history: Array.isArray(data) ? data : [data] },
            'daily',
            (err) => {
                clearTimeout(timeout);  // 关键修复点
                if (isCallbackCalled) return;
                isCallbackCalled = true;
                
                if (err) {
                    console.error('保存数据时出错:', err);
                    callback(err);
                } else {
                    console.log('数据保存成功:', symbol);
                    callback(null);
                }
            }
        );
    } catch (e) {
        console.error('保存数据时捕获异常:', e);
        callback(e);
    }
}


// 展示股票基础信息
function displayStockOverview(data) {
    const outputElement = document.getElementById('output-content');
    if (!outputElement) return;

    // 清空输出框
    outputElement.innerHTML = '';

    // 创建展示内容
    const overviewHTML = `
        <div class="section">
            <div class="section-title">公司概况</div>
            <p><strong>股票代码：</strong>${data.Symbol}</p>
            <p><strong>公司名称：</strong>${data.Name}</p>
            <p><strong>行业：</strong>${data.Industry}</p>
            <p><strong>描述：</strong>${data.Description}</p>
        </div>
        <div class="section">
            <div class="section-title">财务信息</div>
            <p><strong>市值：</strong>${data.MarketCapitalization}</p>
            <p><strong>市盈率（P/E）：</strong>${data.PERatio}</p>
            <p><strong>每股收益（EPS）：</strong>${data.EPS}</p>
            <p><strong>股息率：</strong>${data.DividendYield}</p>
        </div>
        <div class="section">
            <div class="section-title">估值信息</div>
            <p><strong>市净率（P/B）：</strong>${data.PriceToBookRatio}</p>
            <p><strong>市销率（P/S）：</strong>${data.PriceToSalesRatioTTM}</p>
            <p><strong>企业价值（EV/EBITDA）：</strong>${data.EVToEBITDA}</p>
        </div>
        <div class="section">
            <div class="section-title">其他信息</div>
            <p><strong>52 周最高价：</strong>${data['52WeekHigh']}</p>
            <p><strong>52 周最低价：</strong>${data['52WeekLow']}</p>
            <p><strong>分析师目标价：</strong>${data.AnalystTargetPrice}</p>
        </div>
    `;

    // 插入到输出框
    outputElement.innerHTML = overviewHTML;
}

async function fetchStockData(stockCode) {
    toggleHourglass(true);
    try {
        // 1. 获取时间序列数据
        const timeSeriesData = await fetchStockTimeSeries(stockCode);
        console.log('获取到时间序列数据:', timeSeriesData);
        
        // 2. 保存时间序列数据（仅添加超时清理）
        if (timeSeriesData) {
            let timeout; // 声明在外部以便清理
            try {
                await new Promise((resolve, reject) => {
                    timeout = setTimeout(() => {
                        reject(new Error('数据库操作超时 (3秒)'));
                    }, 3000);
                    
                    saveDataToDB(timeSeriesData, `${stockCode}_time_series`, (err) => {
                        clearTimeout(timeout); // 关键修复点
                        err ? reject(err) : resolve();
                    });
                });
            } catch (err) {
                console.error('保存异常:', err.message);
                // 不阻断流程
            }
        }

        // 3. 获取基础信息
        const overviewData = await fetchStockOverview(stockCode);
        
        // 4. 显示基础信息
        if (overviewData) {
            displayStockOverview(overviewData);
        }
    } catch (error) {
        console.error('主流程错误:', error);
        document.getElementById('output-content').innerHTML = 
            `<div class="error">${stockCode} 数据获取失败: ${error.message}</div>`;
    } finally {
        toggleHourglass(false);
    }
}

async function fetchStockData0(stockCode) {
    toggleHourglass(true);
    console.log('[1] 开始获取数据', stockCode); // 新增
    
    try {
        // 1. 获取时间序列数据
        console.log('[2] 正在获取时间序列数据...'); // 新增
        const timeSeriesData = await fetchStockTimeSeries(stockCode);
        console.log('[3] 获取到时间序列数据', { 
            length: timeSeriesData ? timeSeriesData.length : 0,
            sample: timeSeriesData ? timeSeriesData[0] : null // 打印第一条样本
        }); // 新增
        
        // 2. 保存数据
        if (timeSeriesData) {
            console.log('[4] 开始保存数据到DB'); // 新增
            try {
                await new Promise((resolve, reject) => {
                    console.log('[5] 创建保存Promise'); // 新增
                    
                    saveDataToDB(timeSeriesData, `${stockCode}_time_series`, (err) => {
                        console.log('[6] saveDataToDB回调执行', { 
                            err: err ? err.message : null 
                        }); // 新增
                        if (err) reject(err);
                        else resolve();
                    });
                    
                    setTimeout(() => {
                        console.log('[7] 超时回调触发'); // 新增
                        reject(new Error('数据库操作超时 (3秒)'));
                    }, 3000);
                });
                console.log('[8] 保存Promise完成'); // 新增
            } catch (err) {
                console.error('[9] 保存数据时捕获异常:', {
                    message: err.message,
                    stack: err.stack,
                    isTimeout: err.message.includes('超时') // 区分错误类型
                }); // 增强
            }
        }

        // 3. 获取基础信息
        console.log('[10] 正在获取概览数据...'); // 新增
        const overviewData = await fetchStockOverview(stockCode);
        console.log('[11] 获取到概览数据', overviewData ? '成功' : '失败'); // 新增
        
        // 4. 显示基础信息
        if (overviewData) {
            console.log('[12] 开始显示概览'); // 新增
            displayStockOverview(overviewData);
        }
    } catch (error) {
        console.error('[13] 主流程捕获异常:', {
            error: error.message,
            stack: error.stack,
            time: new Date().toISOString()
        }); // 增强
        document.getElementById('output-content').innerHTML = 
            `<div class="error">${stockCode} 数据获取失败: ${error.message}</div>`;
    } finally {
        console.log('[14] 最终清理'); // 新增
        toggleHourglass(false);
    }
}

async function fetchStockData00(stockCode) {
    toggleHourglass(true);
    try {
        // 1. 获取时间序列数据
        const timeSeriesData = await fetchStockTimeSeries(stockCode);
        console.log('获取到时间序列数据:', timeSeriesData);
        
        // 2. 保存时间序列数据（带详细错误处理）
        if (timeSeriesData) {
            try {
                await new Promise((resolve, reject) => {
                    saveDataToDB(timeSeriesData, `${stockCode}_time_series`, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                    
                    // 3秒超时
                    setTimeout(() => {
                        reject(new Error('数据库操作超时 (3秒)'));
                    }, 3000);
                });
            } catch (err) {
                console.error('保存时间序列数据失败:', {
                    error: err,
                    stack: err.stack,
                    data: timeSeriesData
                });
                // 不rethrow，继续执行
            }
        }

        // 3. 获取基础信息
        const overviewData = await fetchStockOverview(stockCode);
        
        // 4. 显示基础信息
        if (overviewData) {
            displayStockOverview(overviewData);
        }
    } catch (error) {
        console.error('获取股票数据主流程失败:', {
            error: error,
            stack: error.stack
        });
        document.getElementById('output-content').innerHTML = 
            `<div class="error">${stockCode} 数据获取失败: ${error.message}</div>`;
    } finally {
        toggleHourglass(false);
    }
}

// 导出函数
window.dataFetching = {
    fetchStockData
};