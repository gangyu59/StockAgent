function saveStockList(stockList) {
    localStorage.setItem('stockList', JSON.stringify(stockList));
}

function loadStockList() {
    return JSON.parse(localStorage.getItem('stockList')) || [];
}