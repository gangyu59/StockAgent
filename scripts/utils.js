function showMessage(message) {
    alert(message);
}

// 切换加载状态
function toggleHourglass(show) {
    const loadingIndicator = document.getElementById('loading-indicator');

    if (loadingIndicator) {
        console.log(`⏳ 切换加载状态: ${show}`);
        
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