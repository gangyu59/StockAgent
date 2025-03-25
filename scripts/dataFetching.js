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

        // 打印完整的 API 响应
 //       console.log('API Response:', JSON.stringify(data, null, 2));

        // 检查 API 返回的错误信息
        if (data.Information) {
            throw new Error(data.Information);
        }
        if (data['Error Message']) {
            throw new Error(data['Error Message']);
        }

        // 解析时间序列数据
        const timeSeries = data['Time Series (Daily)'];
        if (!timeSeries) {
            throw new Error('No time series data found');
        }

        // 格式化数据
        const stockData = Object.keys(timeSeries)
            .map(date => ({
                date,
                open: parseFloat(timeSeries[date]['1. open']),
                high: parseFloat(timeSeries[date]['2. high']),
                low: parseFloat(timeSeries[date]['3. low']),
                close: parseFloat(timeSeries[date]['4. close']),
                volume: parseInt(timeSeries[date]['6. volume'])
            }));

        return stockData;
		} catch (error) {
		    console.error('Full Error Details:', {
		        name: error.name,         // 错误类型
		        message: error.message,   // 错误描述
		        stack: error.stack,       // 调用栈
		        url: url,                 // 请求URL
		    });
		    return null;
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
function saveDataToDB(data, symbol, callback) {
    // 参数兼容处理（如果旧代码传了filename如'AAPL.json'）
    var stockSymbol = symbol.replace('.json', '');
    
    // 调用全局数据库对象
    StockDB.saveStockData(stockSymbol, data, 'daily', function(err) {
        if (err) {
            console.error('保存到数据库失败:', err);
            if (callback) callback(err);
        } else {
            console.log('数据已保存到DB:', stockSymbol);
            if (callback) callback(null);
        }
    });
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

// 获取数据按钮点击事件
async function oldfetchStockData(stockCodes) {
    for (const stockCode of stockCodes) {
			
        // 获取时间序列数据
        const timeSeriesData = await fetchStockTimeSeries(stockCode);
				console.log(timeSeriesData);
        if (timeSeriesData) {
            saveDataToFile(timeSeriesData, `data/${stockCode}_time_series.json`); // 保存到 data 文件夹
        }
				
				// 添加延迟（12秒 = 60秒/5次）
    		await new Promise(resolve => setTimeout(resolve, 5000)); 

        // 获取基础信息
        const overviewData = await fetchStockOverview(stockCode);
        if (overviewData) {
            saveDataToFile(overviewData, `data/${stockCode}_overview.json`); // 保存到 data 文件夹
            displayStockOverview(overviewData); // 展示基础信息
        }
    }
}

// 获取数据按钮点击事件（仅替换存储方式，其他完全不变）
async function fetchStockData(stockCodes) {
		toggleHourglass(true);
    for (const stockCode of stockCodes) {
        // 获取时间序列数据（完全不变）
        const timeSeriesData = await fetchStockTimeSeries(stockCode);
//        console.log(timeSeriesData);
        
        if (timeSeriesData) {
            // 仅修改这一行：存到DB而不是文件
            await new Promise(resolve => {
                saveDataToDB(timeSeriesData, `${stockCode}_time_series`, resolve);
            });
        }
        
        // 延迟保持完全不变
        await new Promise(resolve => setTimeout(resolve, 5000)); 

        // 获取基础信息（完全不变）
        const overviewData = await fetchStockOverview(stockCode);
        if (overviewData) {
            // 仅修改这一行：存到DB而不是文件
            await new Promise(resolve => {
                saveDataToDB(overviewData, `${stockCode}_overview`, resolve);
            });
            displayStockOverview(overviewData); // 展示基础信息（完全不变）
        }
    }
		toggleHourglass(false);
}

// 导出函数
window.dataFetching = {
    fetchStockData
};