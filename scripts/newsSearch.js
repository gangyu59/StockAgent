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

        // 添加日期处理和摘要字段
        const articles = data.articles || [];
        const newsList = articles
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)) // 时间倒序
            .slice(0, limit)
            .map(article => ({
                date: formatDate(article.publishedAt), // 新增日期格式化
                title: article.title || 'No title',
                summary: truncateSummary(article.description || article.content || ''), // 新增摘要
                link: article.url || '#'
            }));

        return newsList;
    } catch (error) {
        console.error(`Error fetching news for ${symbol}:`, error);
        return [];
    }
}

// 展示新闻列表
function displayNewsList(newsList, symbol) {
    const outputElement = document.getElementById('output-content');
    if (!outputElement) return;

    // 清空输出框
    outputElement.innerHTML = '';

    // 创建符合CSS结构的新闻列表
    const newsHTML = `
    <div class="stock-news-container">
        <h4>${symbol} 最新新闻</h4>
        <ol class="stock-news-list">
            ${newsList.map((news, index) => `
            <li class="news-item">
                <span class="news-rank">${index + 1}.</span>
                <div class="news-content">
                    <span class="news-date">${news.date}</span>
                    <a href="${news.link}" 
                       target="_blank" 
                       class="news-title"
                       title="${news.summary}">${news.title}</a>
                    ${news.summary ? `<p class="news-summary">${news.summary}</p>` : ''}
                </div>
            </li>
            `).join('')}
        </ol>
        <div class="news-footer">
            数据更新时间: ${new Date().toLocaleString('zh-CN')}
        </div>
    </div>`;

    outputElement.innerHTML = newsHTML;
}

// 日期格式化函数
function formatDate(isoString) {
    if (!isoString) return '未知日期';
    try {
        const date = new Date(isoString);
        return date.toISOString().split('T')[0]; // 返回YYYY-MM-DD格式
    } catch {
        return '日期无效';
    }
}

// 摘要处理函数
function truncateSummary(text, maxLength = 80) {
    if (!text) return '';
    const cleanText = text.replace(/<\/?[^>]+(>|$)/g, ""); // 移除HTML标签
    return cleanText.length > maxLength 
        ? cleanText.substring(0, maxLength) + '...'
        : cleanText;
}

// 搜索新闻
async function searchStockNews(stockCode) {
    const outputElement = document.getElementById('output-content');
		
    try {
				toggleHourglass(true);
            const newsList = await fetchStockNews(stockCode);
            if (newsList.length > 0) {
                displayNewsList(newsList, stockCode); // 添加股票代码参数
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
}

// 导出
window.newsSearch = {
    searchStockNews
};