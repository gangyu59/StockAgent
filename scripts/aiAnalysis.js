function analyzeStockWithAI(stockCodes) {
    stockCodes.forEach(stockCode => {
        const url = GPT_API_URL; // 使用 GPT API URL
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GPT_API_KEY}` // 使用 GPT API 密钥
            },
            body: JSON.stringify({
                model: GPT_API_MODEL, // 使用 GPT 模型
                messages: [{ role: 'user', content: `分析股票 ${stockCode}` }],
                ...DEFAULT_OPTIONS
            })
        };
        fetch(url, options)
            .then(response => response.json())
            .then(data => {
                console.log(`AI Analysis for ${stockCode}:`, data);
                generateStockReport({ stockCode, analysis: data.choices[0].message.content });
            })
            .catch(error => console.error('Error analyzing stock:', error));
    });
}