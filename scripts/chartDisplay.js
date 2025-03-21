function displayStockChart(stockData) {
    const chartArea = document.getElementById('chart-area');
    chartArea.style.display = 'block';

    const dates = Object.keys(stockData['Time Series (Daily)']).reverse();
    const prices = dates.map(date => parseFloat(stockData['Time Series (Daily)'][date]['4. close']));

    const ctx = document.getElementById('stock-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Stock Price',
                data: prices,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}