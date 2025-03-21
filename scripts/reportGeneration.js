function generateStockReport(data) {
    const outputElement = document.getElementById('output-content');
    const { stockCode, news, analysis } = data;

    let report = `<h2>${stockCode} 研究报告</h2>`;
    report += `<p><strong>公司概况：</strong>${analysis?.companyOverview || '暂无数据'}</p>`;
    report += `<p><strong>财务分析：</strong>${analysis?.financialAnalysis || '暂无数据'}</p>`;
    report += `<p><strong>估值分析：</strong>${analysis?.valuationAnalysis || '暂无数据'}</p>`;
    report += `<p><strong>风险分析：</strong>${analysis?.riskAnalysis || '暂无数据'}</p>`;
    report += `<p><strong>投资建议：</strong>${analysis?.investmentRecommendation || '暂无数据'}</p>`;

    if (news) {
        report += `<h3>新闻汇总</h3>`;
        report += news.map(article => `<p><a href="${article.url}" target="_blank">${article.title}</a></p>`).join('');
    }

    outputElement.innerHTML = report;
}