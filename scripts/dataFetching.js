function fetchStockData(stockCodes) {
    const apiKey = 'YOUR_ALPHA_VANTAGE_API_KEY'; // 替换为您的 Alpha Vantage API 密钥
    stockCodes.forEach(stockCode => {
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stockCode}&apikey=${apiKey}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log(`Data for ${stockCode}:`, data);
                displayStockChart(data);
            })
            .catch(error => console.error('Error fetching stock data:', error));
    });
}