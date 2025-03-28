window.aiAnalysis = (function() {
    async function generateStockReport(symbol) {
        if (!symbol) {
            throw new Error('股票代码不能为空');
        }
				
        const systemPrompt = `
你是一名资深金融分析师，擅长撰写结构清晰、数据合理、语气专业的股票分析报告。
请严格按照结构生成内容，语言为中文。
        `.trim();

        const userPrompt = `
请撰写一份关于股票代码「${symbol}」的专业股票分析报告，必须包含：

1. 执行摘要（含当前股价、目标价位区间、投资评级建议）
2. 公司简介（主营业务、最新动态）
3. 财务分析（最新财报数据：营收、净利润、自由现金流）
4. 估值分析（P/E、P/S、PEG、行业对比）
5. 行业趋势与宏观背景（含该公司所处行业的机会与风险）
6. 投资亮点（如技术护城河、品牌优势、管理团队）
7. 风险因素（市场波动、政策不确定性等）
8. AI 投资建议（明确给出投资评级：买入/观望/卖出，并说明理由）

要求：
- 保证内容为过去半年的分析视角；
- 内容务实、逻辑清晰，避免空泛套话；
- 每节标题清晰，分段合理；
- 语言简洁专业，适合提交给投资人。
        `.trim();

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        const response = await callDeepSeek(messages, {
            testType: 'deepseek',       // 非多模态
            max_tokens: 2000,      // 增加 token 保证内容完整
            temperature: 0.7       // 可调节语气
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