/**
 * 调用DeepSeek模型
 * @param {Array} messages - 消息列表
 * @param {Object} options - 可选参数（如max_tokens, temperature等）
 * @returns {Promise<Object>} - DeepSeek的响应结果
 */
var callDeepSeek = async function(messages, options = {}) {
    const headers = {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
    };

    const body = {
        model: DEEPSEEK_API_MODEL, // 使用配置中的模型名称
        messages: messages,
        max_tokens: options.max_tokens || 1000, // 默认值1000
        temperature: options.temperature || 0.7 // 默认值0.7
    };

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorResponse = await response.text();
            console.error('API请求失败，响应内容:', errorResponse);
            throw new Error(`API请求失败: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('调用DeepSeek时出错:', error);
        throw error;
    }
};