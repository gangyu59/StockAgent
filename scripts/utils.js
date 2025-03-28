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

// 极简调试工具
const debug = {
  log: (msg) => {
    // 方法1: alert弹窗（适合短信息）
    alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    
    // 方法2: 页面顶部显示（适合长信息）
    const debugDiv = document.getElementById('debug-alert') || (() => {
      const div = document.createElement('div');
      div.id = 'debug-alert';
      div.style = 'position:fixed; top:0; left:0; background:red; color:white; z-index:99999; padding:10px;';
      document.body.prepend(div);
      return div;
    })();
    debugDiv.innerHTML += `<div>${typeof msg === 'string' ? msg : JSON.stringify(msg)}</div>`;
  }
};

// tab 切换函数
function switchToTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.toggle('active', tab.id === tabId);
    });

    // 如果是切换到图表 tab，并且 chartRenderer 已加载
    if (tabId === 'chart-tab' && window.chartRenderer?.resizeChart) {
        setTimeout(() => {
            window.chartRenderer.resizeChart();
        }, 50); // 延迟执行，确保 tab 已完全显示
    }
}