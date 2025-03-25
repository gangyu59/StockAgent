// scripts/newsSearch.js

// 配置检查（保持原样）
if (!ARK_API_KEY || !ARK_API_URL || !ARK_API_MODEL) {
    console.error('ARK API配置未完成！请先定义ARK_API_KEY、ARK_API_URL和ARK_API_MODEL');
}

/**
 * 终极修复版JSON解析器（保持您的原始逻辑）
 */
function parseMixedJSONResponse(response) {
    // 情况1：直接返回已解析的数组（保持原样）
    if (Array.isArray(response)) return response;
    
    // 情况2：处理完整API响应对象（新增）
    if (typeof response === 'object' && response.choices) {
        try {
            const content = response.choices[0]?.message?.content || '';
            if (content.startsWith('[') || content.startsWith('{')) {
                return JSON.parse(content);
            }
        } catch (e) {
            console.warn('解析API对象失败:', e);
        }
    }
    
    // 保持您原有的文本解析逻辑（完全不变）
    const responseText = typeof response === 'string' ? response : JSON.stringify(response);
    
    // 处理```json标记（原样保留）
    const jsonMarkers = responseText.match(/```(json)?([\s\S]*?)```/);
    if (jsonMarkers && jsonMarkers[2]) {
        try {
            return JSON.parse(jsonMarkers[2].trim());
        } catch (e) {
            console.warn('JSON标记块解析失败，尝试其他方法');
        }
    }
    
    // 提取纯JSON部分（原样保留）
    const jsonStart = Math.max(responseText.indexOf('['), responseText.indexOf('{'));
    const jsonEnd = Math.max(responseText.lastIndexOf(']'), responseText.lastIndexOf('}'));
    
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
        try {
            return JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
        } catch (e) {
            console.warn('直接提取JSON失败:', e);
        }
    }
    
    // 最终尝试（原样保留）
    try {
        return JSON.parse(responseText);
    } catch (e) {
        throw new Error('无法解析响应数据: ' + responseText.slice(0, 100));
    }
}

/**
 * 完全保持您原有逻辑的新闻获取函数
 */
async function fetchStockNews(symbol, limit = 10) {
    try {
        // 您的原始prompt（一字不改）
        const prompt = `请严格按以下要求提供${limit}条影响股票代码为${symbol}的股价的真实重大新闻：
1. 只返回有效的JSON数组，不要包含任何解释性文本
2. 每条必须包含：
   - date: 日期(YYYY-MM-DD)
   - title: 标题
   - summary: 内容摘要(30-50字)
   - link: 真实新闻链接
3. 限制于过去三个月内的报道，严格按时间倒序排列
4. 股市包括NASFAQ和New York Exchange
5. 示例格式：
[{
    "date": "2024-06-18",
    "title": "标题",
    "summary": "摘要...",
    "link": "https://真实新闻链接"
}]`;

        const response = await callARK([
            { role: 'user', content: prompt }
        ], {
            temperature: 0.1,
            max_tokens: 2000
        });

        console.log('API原始响应:', response); // 调试日志
        
        // 关键修改：直接传入整个response对象
        const newsList = parseMixedJSONResponse(response);
        
        // 保持您原有的数据清洗逻辑（完全不变）
        return (Array.isArray(newsList) ? newsList : [])
            .slice(0, limit)
            .map(item => ({
                date: item.date?.replace(/[^0-9-]/g, '').substring(0, 10) || '未知日期',
                title: item.title?.trim() || '无标题',
                summary: item.summary?.trim() || item.data?.trim() || '暂无摘要',
                link: validateUrl(item.link?.trim())
            }))
            .filter(item => item.title !== '无标题');

    } catch (error) {
        console.error(`获取${symbol}新闻失败:`, error);
        return [];
    }
}

// 保持您原有的URL验证函数（完全不变）
function validateUrl(url) {
    if (!url) return '#';
    try {
        const u = new URL(url);
        return ['http:', 'https:'].includes(u.protocol) ? url : '#';
    } catch {
        return '#';
    }
}

// 保持您原有的展示函数（完全不变）
function displayNewsList(newsList, symbol) {
    const outputElement = document.getElementById('output-content');
    if (!outputElement) return;

    let html = `<div class="stock-news-container">
        <h4>影响 ${symbol} 股价的重大新闻</h4>
        <ol class="stock-news-list">`;
    
    newsList.forEach((item, index) => {
        html += `
        <li class="news-item">
            <span class="news-rank">${index + 1}.</span>
            <div class="news-content">
                <span class="news-date">${item.date}</span>
                <a href="${item.link}" target="_blank" rel="noopener" class="news-title">${item.title}</a>
                <p class="news-summary">${item.summary}</p>
            </div>
        </li>`;
    });
    
    outputElement.innerHTML = html + `</ol>
        <div class="news-footer">数据更新时间: ${new Date().toLocaleString()}</div>
    </div>`;
}

// 保持您原有的搜索函数（完全不变）
async function searchStockNews(stockCodes) {
    if (!Array.isArray(stockCodes)) stockCodes = [stockCodes];
    
    const outputElement = document.getElementById('output-content');
    if (outputElement) outputElement.innerHTML = '<div class="loading">加载中...</div>';

    try {
        for (const stockCode of stockCodes) {
            const newsList = await fetchStockNews(stockCode);
            if (outputElement) displayNewsList(newsList, stockCode);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error('新闻搜索失败:', error);
        if (outputElement) {
            outputElement.innerHTML = `<p class="error">新闻获取失败: ${error.message}</p>`;
        }
    }
}

// 保持原有模块导出（完全不变）
window.newsSearch = { searchStockNews };