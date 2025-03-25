/**
 * 调用 DALL-E 模型生成图片
 * @param {string} prompt - 图片描述
 * @param {Object} options - 可选参数（如图片大小、数量等）
 * @returns {Promise<Object>} - DALL-E 的响应结果
 */
var callDalle = async function(prompt, options = {}) {
    const headers = {
        'Authorization': `Bearer ${DALLE_API_KEY}`,
        'Content-Type': 'application/json'
    };

    const body = {
        model: DALLE_API_MODEL, // 使用配置中的模型名称
        prompt: prompt, // 图片描述
        n: options.n || 1, // 生成图片的数量，默认 1
        size: options.size || '1024x1024' // 图片大小，默认 1024x1024
    };

    try {
        console.log('发送 DALL-E API 请求:', {
            url: DALLE_API_URL,
            headers: headers,
            body: body
        });

        const response = await fetch(DALLE_API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        console.log('DALL-E API 响应状态:', response.status, response.statusText);

        if (!response.ok) {
            const errorResponse = await response.text();
            console.error('DALL-E API 请求失败，响应内容:', errorResponse);
            throw new Error(`DALL-E API 请求失败: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('DALL-E API 响应数据:', data);
        return data;
    } catch (error) {
        console.error('调用 DALL-E 时出错:', error);
        throw error;
    }
};