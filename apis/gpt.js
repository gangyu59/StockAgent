/**
 * 调用GPT模型（支持多模态）
 * @param {Array} messages - 消息列表（可能包含多模态内容）
 * @param {Object} options - 可选参数 
 * @returns {Promise<Object>} - GPT的响应结果
 */
var callGPT = async function(messages, options = {}) {
    const headers = {
        'api-key': GPT_API_KEY,
        'Content-Type': 'application/json',
				'api-version': '2024-02-15-preview' // 新增
    };

    // 转换多模态消息格式
    const formattedMessages = messages.map(msg => {
        // 多模态消息处理
        if (options.testType === 'multimodal') {
            return {
                role: msg.role,
                content: msg.content.map(item => {
                    if (item.type === 'image') {
                        return {
                            type: "image_url",
                            image_url: {
                                url: item.data, // 来自processImage处理的base64
                                detail: "high"
                            }
                        };
                    }
                    return {
                        type: "text",
                        text: item.text || item.content
                    };
                })
            };
        }
        
        // 非多模态保持原有逻辑
        return {
            role: msg.role,
            content: generatePrompt(msg.content, options.testType)
        };
    });

    const body = {
        model: options.testType === 'multimodal' ? GPT_VISION_MODEL : GPT_API_MODEL,
        messages: formattedMessages,
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7
    };

    console.log('GPT Request:', JSON.stringify(body, null, 2)); // 调试日志
    
    return await callAI(GPT_API_URL, headers, body);
};

// 优化后的提示词生成器
function generatePrompt(input, testType) {
    const promptTemplates = {
        logic: `请严格分析以下逻辑问题：${input}`,
        creative: `请基于以下内容进行创意发挥：${input}`,
        multimodal: `请综合以下多模态内容进行分析：${input}`
    };
    return promptTemplates[testType] || input;
}