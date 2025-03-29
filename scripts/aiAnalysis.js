// scripts/aiAnalysis.js

window.aiAnalysis = (function () {
    async function generateStockReport(symbol) {
        if (!symbol) throw new Error('股票代码不能为空');

        const upperSymbol = symbol.toUpperCase();

        // 1. 提取时间序列
        const priceData = await StockDB.getFormattedStockData(symbol); // 包含 open/high/low/close/volume/date
        if (!priceData || priceData.length === 0) throw new Error('未找到时间序列数据');

        // 2. 提取技术指标
        const techRecord = await StockDB.loadStockData(symbol, 'TECHNICAL_INDICATOR');
        const indicators = Array.isArray(techRecord?.data) ? techRecord.data : [];

        // 3. 组合最近10天的数据
        const merged = [];
        const techMap = Object.fromEntries(indicators.map(item => [item.date, item]));
        for (let i = priceData.length - 10; i < priceData.length; i++) {
            const row = priceData[i];
            const dateStr = row.date.toISOString().split('T')[0];
            const tech = techMap[dateStr] || {};

            merged.push({
                date: dateStr,
                open: row.open ?? '-',
                close: row.close ?? '-',
                high: row.high ?? '-',
                low: row.low ?? '-',
                volume: row.volume ?? '-',
                macd: tech.macd ?? '-',
                macdsignal: tech.macdsignal ?? '-',
                macdhist: tech.macdhist ?? '-',
                rsi: tech.rsi ?? '-',
                obv: tech.obv ?? '-',
                cci: tech.cci ?? '-',
                slowk: tech.slowk ?? '-',
                slowd: tech.slowd ?? '-',
                sma: tech.sma ?? '-',
                atr: tech.atr ?? '-',
                adx: tech.adx ?? '-',
                bbupper: tech.bbupper ?? '-',
                bbmiddle: tech.bbmiddle ?? '-',
                bblower: tech.bblower ?? '-'
            });
        }

        // 4. 构造 Markdown 表格
        const header = `| 日期 | 开盘 | 收盘 | 最高 | 最低 | 成交量 | MACD | Signal | Hist | RSI | OBV | CCI | K | D | MA20 | ATR | ADX | BB上轨 | BB中轨 | BB下轨 |`;
        const divider = `|------|------|------|------|------|--------|------|--------|------|-----|-----|-----|----|----|-------|-----|-----|--------|--------|--------|`;
        const rows = merged.map(row => {
            return `| ${row.date} | ${row.open} | ${row.close} | ${row.high} | ${row.low} | ${row.volume} | ${row.macd} | ${row.macdsignal} | ${row.macdhist} | ${row.rsi} | ${row.obv} | ${row.cci} | ${row.slowk} | ${row.slowd} | ${row.sma} | ${row.atr} | ${row.adx} | ${row.bbupper} | ${row.bbmiddle} | ${row.bblower} |`;
        });

        const indicatorTable = [header, divider, ...rows].join('\n');

        // 5. 构造完整 prompt
        const systemPrompt = `
你是一名资深金融分析师，擅长撰写结构清晰、数据合理、语气专业的股票分析报告。
请严格按照结构生成内容，语言为中文。`.trim();

        const userPrompt = `
请撰写一份关于股票代码「${symbol}」的专业股票分析报告，必须包含：

1. 执行摘要（含当前股价、目标价位区间、投资评级建议）
2. 公司简介（主营业务、最新动态）
3. 财务分析（最新财报数据：营收、净利润、自由现金流）
4. 估值分析（P/E、P/S、PEG、行业对比）
5. 行业趋势与宏观背景（行业机会与风险）
6. 投资亮点（如技术护城河、品牌优势、管理团队）
7. 风险因素（市场波动、政策不确定性等）
8. AI 投资建议（明确给出投资评级：买入/观望/卖出，并说明理由）

【最近10天行情与技术指标】：
${indicatorTable}

要求：
- 分析视角应涵盖过去半年，注重趋势和变化；
- 必须使用上表中的最新指标数据作为参考；
- 内容应专业、逻辑清晰，避免空泛；
- 各小节标题分明，层次清楚；
- 用语适合提交给专业投资人。
        `.trim();

        // 6. 打印 Prompt 用于调试
        console.log('[RAG 提示词内容]：\n', userPrompt);

        // 7. 调用 DeepSeek
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        const response = await callDeepSeek(messages, {
            testType: 'deepseek',
            max_tokens: 2000,
            temperature: 0.7
        });

        const resultText = response?.choices?.[0]?.message?.content;
        if (!resultText) {
            throw new Error('GPT 响应为空或格式不正确');
        }

        return resultText.trim();
    }

    return {
        analyze: generateStockReport
    };
})();