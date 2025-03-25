/**
 * 通用AI模型调用函数
 * @param {string} apiUrl - API接口地址
 * @param {Object} headers - 请求头（包括认证信息）
 * @param {Object} body - 请求体（包括模型名称、消息列表等）
 * @returns {Promise<Object>} - API的响应结果
 */
var callAI = async function(apiUrl, headers, body) {
    try {
        console.log('发送API请求:', {
            url: apiUrl,
            headers: headers,
            body: body
        });

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(body)
        });

        console.log('API响应状态:', response.status, response.statusText);

        if (!response.ok) {
            // 尝试读取错误信息
            const errorResponse = await response.text();
            console.error('API请求失败，响应内容:', errorResponse);
            throw new Error(`API请求失败: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API响应数据:', data);
        return data;
    } catch (error) {
        console.error('调用AI时出错:', error);
        throw error;
    }
};