// scripts/utils.js

// 切换加载状态
function toggleHourglass(show) {
    const loadingIndicator = document.getElementById('loading-indicator');

    if (loadingIndicator) {
        // console.log(`⏳ 切换加载状态: ${show}`);
        
        if (show) {
            loadingIndicator.classList.remove('loading-hidden');
            loadingIndicator.classList.add('status-visible');

            // 触发重绘，确保 DOM 更新
            loadingIndicator.offsetHeight; 
        } else {
            loadingIndicator.classList.remove('status-visible');
            loadingIndicator.classList.add('loading-hidden');
        }
    } else {
        console.error('🚨 loading-indicator 未找到');
    }
}

//清除数据库
function clearDatabase() {
    return new Promise((resolve) => {
        const request = indexedDB.deleteDatabase('StockDataDB');
        
        request.onsuccess = () => {
            console.log('数据库已清除');
            resolve(true);
        };
        
        request.onerror = (event) => {
            console.error('清除失败:', event.target.error);
            resolve(false); // 仍然继续执行
        };
        
        request.onblocked = () => {
            console.warn('数据库被占用，请关闭其他页面');
            resolve(false);
        };
    });
}