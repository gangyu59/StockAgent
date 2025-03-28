window.reportGenerator = (function () {
    function renderAIReport(text) {
        const container = document.getElementById('ai-tab');
        if (!container) return;

        // Markdown 转换为 HTML（简单处理）
        const html = text
            .replace(/^# (.*)$/gm, '<h1>$1</h1>')
            .replace(/^## (.*)$/gm, '<h2>$1</h2>')
            .replace(/^### (.*)$/gm, '<h3>$1</h3>')
            .replace(/\n{2,}/g, '<br><br>')   // 段落空行
            .replace(/\n/g, '<br>');         // 保留换行

        container.innerHTML = `
            <div class="ai-report-wrapper">
                ${html}
            </div>
        `;
    }

    return {
        renderAIReport
    };
})();