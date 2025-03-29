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
            .slice(0, 100)
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

function displayStockOverview(data) {
    const outputElement = document.getElementById('overview-tab');
    if (!outputElement) return;

    // 清空当前页（不影响其他 tab）
    outputElement.innerHTML = '';

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

    outputElement.innerHTML = overviewHTML;
}

async function fetchStockData(stockCode) {
    toggleHourglass(true);
    try {
        // 1. 获取时间序列数据
        const timeSeriesData = await fetchStockTimeSeries(stockCode);
//        console.log('获取到时间序列数据:', timeSeriesData);

        // 2. 保存时间序列数据（使用统一 API）
        if (timeSeriesData) {
            try {
                await Promise.race([
                    StockDB.saveStockData(stockCode, timeSeriesData, 'TIME_SERIES'),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('数据库操作超时 (3秒)')), 3000))
                ]);
            } catch (err) {
                console.error('保存时间序列失败:', err.message);
            }
        }

				// 获取技术指标
				const indicators = await fetchAllTechnicalIndicators(stockCode, 90);
				await saveTechnicalToDB(stockCode, indicators);

        // 3. 获取基础信息
        const overviewData = await fetchStockOverview(stockCode);

        // 4. 显示基础信息
        if (overviewData) {
            displayStockOverview(overviewData);

            // 同步存入 overview（推荐）
            try {
                await StockDB.saveStockData(stockCode, overviewData, 'OVERVIEW');
            } catch (err) {
                console.error('保存overview失败:', err.message);
            }
        }
    } catch (error) {
        console.error('主流程错误:', error);
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