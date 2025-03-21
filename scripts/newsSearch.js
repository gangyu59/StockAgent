function fetchStockNews(stockCodes) {
    const apiKey = 'YOUR_NEWS_API_KEY'; // 替换为您的 NewsAPI 密钥
    stockCodes.forEach(stockCode => {
        const url = `https://newsapi.org/v2/everything?q=${stockCode}&apiKey=${apiKey}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log(`News for ${stockCode}:`, data);
                generateStockReport({ stockCode, news: data.articles });
            })
            .catch(error => console.error('Error fetching news:', error));
    });
}