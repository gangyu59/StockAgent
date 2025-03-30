// scripts/newsSearch.js

// 获取股票新闻
async function fetchStockNews(symbol, limit = 10) {
    const url = `${NEWS_API_URL}?q=${symbol}&apiKey=${NEWS_API_KEY}&language=en&sortBy=publishedAt`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'ok') {
            throw new Error(`News API error: ${data.message || 'Unknown error'}`);
        }

        // 格式化处理
        const articles = data.articles || [];
        const newsList = articles
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .slice(0, limit)
            .map(article => ({
                date: formatDate(article.publishedAt),
                title: article.title || 'No title',
                summary: truncateSummary(article.description || article.content || ''),
                link: article.url || '#'
            }));

        return newsList;
    } catch (error) {
        console.error(`Error fetching news for ${symbol}:`, error);
        return [];
    }
}

// 保存到 IndexedDB
async function saveNewsToDB(symbol, newsList) {
    const key = `${symbol.toUpperCase()}_NEWS`;
    const record = {
        symbol: key,
        type: 'NEWS',
        data: newsList,
        lastUpdated: new Date().toISOString()
    };
    try {
        console.log(`[DB] 删除旧新闻记录: ${key}`);
        await StockDB.saveStockData(symbol, newsList, 'NEWS');
        console.log('[DB] 新闻保存成功:', key);
    } catch (err) {
        console.error('[DB] 新闻保存失败:', err.message);
    }
}

// 展示新闻列表
function displayNewsList(newsList, symbol) {
    const outputElement = document.getElementById('news-tab');
    if (!outputElement) return;

    outputElement.innerHTML = `
    <div class="stock-news-container">
        <h4>${symbol} 最新新闻</h4>
        <ol class="stock-news-list">
            ${newsList.map((news, index) => `
            <li class="news-item">
                <span class="news-rank">${index + 1}.</span>
                <div class="news-content">
                    <span class="news-date">${news.date}</span>
                    <a href="${news.link}" target="_blank" class="news-title" title="${news.summary}">${news.title}</a>
                    ${news.summary ? `<p class="news-summary">${news.summary}</p>` : ''}
                </div>
            </li>
            `).join('')}
        </ol>
        <div class="news-footer">数据更新时间: ${new Date().toLocaleString('zh-CN')}</div>
    </div>`;
}

// 日期格式化函数
function formatDate(isoString) {
    if (!isoString) return '未知日期';
    try {
        const date = new Date(isoString);
        return date.toISOString().split('T')[0];
    } catch {
        return '日期无效';
    }
}

// 摘要处理函数
function truncateSummary(text, maxLength = 80) {
    if (!text) return '';
    const cleanText = text.replace(/<\/?[^>]+(>|$)/g, ""); // 移除 HTML 标签
    return cleanText.length > maxLength 
        ? cleanText.substring(0, maxLength) + '...'
        : cleanText;
}

// 搜索新闻主函数
async function searchStockNews(stockCode) {
    const outputElement = document.getElementById('output-content');
    try {
        toggleHourglass(true);
        showCopyButton(false);

        const newsList = await fetchStockNews(stockCode);
        if (newsList.length > 0) {
            await saveNewsToDB(stockCode, newsList);
            displayNewsList(newsList, stockCode);
        } else {
            outputElement.innerHTML = `<p class="no-news">未找到相关新闻</p>`;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        console.error('新闻搜索失败:', error);
        if (outputElement) {
            outputElement.innerHTML = `<p class="error">新闻获取失败: ${error.message}</p>`;
        }
    }
    toggleHourglass(false);
    showCopyButton(true);
}

// 导出
window.newsSearch = {
    searchStockNews
};