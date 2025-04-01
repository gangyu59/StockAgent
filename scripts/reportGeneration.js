window.reportGenerator = (function () {
    function renderAIReport(text, symbol = '') {
        const container = document.getElementById('ai-tab');
        if (!container) return;

        // Markdown 转换为 HTML（简单处理）
        const html = text
            .replace(/^# (.*)$/gm, '<h1>$1</h1>')
            .replace(/^## (.*)$/gm, '<h2>$1</h2>')
            .replace(/^### (.*)$/gm, '<h3>$1</h3>')
            .replace(/\n{2,}/g, '<br><br>')
            .replace(/\n/g, '<br>');

        container.innerHTML = `
            <div class="ai-report-wrapper">
                ${html}
            </div>`;
    }

    return {
        renderAIReport
    };
})();

function sanitizeText(text) {
  return text
    // 移除 GPT 返回中的转义 Unicode（如 \u2191）
    .replace(/\\[uU][0-9a-fA-F]{4}/g, '')

    // 清除不可见字符
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '')

    // 替换特殊空格
    .replace(/[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g, ' ')

    // 替换非 ASCII 标点
    .replace(/[‐‑‒–—―]/g, '-')   // 破折号
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[…⋯⋮⋱]/g, '...')
    .replace(/[•◦∙·]/g, '-')     // bullet 项
    .replace(/[※☆★◆◇◎]/g, '*')

    // 替换全角标点
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/：/g, ':')
    .replace(/；/g, ';')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/[【】]/g, '[]')
    .replace(/[《》]/g, '<>')

    // 保留 Markdown 表格结构的竖线 |，不要再删掉！
    //.replace(/\|/g, ' ') <-- 移除这句！

    // 清除 markdown 标题等，但保留表格结构
    .replace(/(^|\n)#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/[*_~`#]/g, '')

    // 百分号正常化
    .replace(/([+-]?\d+(\.\d+)?)%/g, '$1 percent')

    // 空行、空格压缩
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/gm, '')
		.replace(/[↑↓↗↘↔↕⇧⇩]/g, '')  // 删除箭头字符

    .trim();
}

// GPT 翻译函数（调用 callGPT）
async function translateTextToEnglish(text) {
    const messages = [
        {
            role: 'system',
            content: `You are a professional financial translator. Please translate the following Chinese investment report into fluent, formal English suitable for professional PDF reporting. Only output the translated text, do not explain. Strictly follow the following rules: 1. The result must be purely English, no Chinese or non-English characters. 2. Use only standard ASCII characters: letters, numbers, and common punctuation (. , : ; - ( )). Avoid arrows (→), fancy symbols (★), emojis, and any special Unicode. 3. If the original contains tables or special formatting, simplify it into readable English paragraphs. 4. Ensure content remains professional, clear, and concise. Always sanitize your output to ensure it is PDF-safe and English-only.`.trim(),
        },
        {
            role: 'user',
            content: text
        }
    ];

    const response = await callGPT(messages);
    const result = response?.choices?.[0]?.message?.content;
		console.log("英文翻译结果：", result);
    return result?.trim();
}


async function captureTabAsImage(tabId) {
  // 切换 tab 显示
  const allTabs = ['overview-tab', 'news-tab', 'chart-tab', 'ai-tab'];
  allTabs.forEach(id => {
    const tab = document.getElementById(id);
    if (tab) tab.style.display = (id === tabId) ? 'block' : 'none';
  });

  // 等待渲染（图表需要多一点时间）
  await new Promise(resolve => setTimeout(resolve, tabId === 'chart-tab' ? 500 : 200));

  const element = document.getElementById(tabId);
  if (!element) {
    console.warn(`Tab element "${tabId}" not found`);
    return null;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff'
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error(`Error capturing tab "${tabId}":`, err);
    return null;
  }
}

async function exportReportAsPDF(symbol) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imageHeight = 297;
  const imageWidth = 210;

  const tabs = ['overview-tab', 'news-tab', 'chart-tab', 'ai-tab'];

  for (let i = 0; i < tabs.length; i++) {
    const imgData = await captureTabAsImage(tabs[i]);
    if (imgData) {
      if (i > 0) pdf.addPage();
				 const img = new Image();
				img.src = imgData;
				
				await new Promise(resolve => {
				  img.onload = () => {
				    const ratio = img.width / img.height;
				    const targetWidth = imageWidth;
				    const targetHeight = imageWidth / ratio; // 按宽度等比缩放
				    const yOffset = Math.max((imageHeight - targetHeight) / 2, 0); // 垂直居中（可选）
				
				    pdf.addImage(img, 'PNG', 0, yOffset, targetWidth, targetHeight);
				    resolve();
				  };
				});
      console.log(`✅ Added image for tab ${tabs[i]}`);
    } else {
      console.warn(`⚠️ Skipped tab "${tabs[i]}"`);
    }
  }

  // 恢复显示所有 tab
  tabs.forEach(id => {
    const tab = document.getElementById(id);
    if (tab) tab.style.display = 'block';
  });

  pdf.save(`${symbol}_report.pdf`);
  console.log("PDF download complete");
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('download-pdf-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    toggleHourglass(true);
    const symbol = document.getElementById('stock-code').value.trim().toUpperCase();
    if (!symbol) {
      alert('请输入有效的股票代码');
      toggleHourglass(false);
      return;
    }
    await exportReportAsPDF(symbol);
    toggleHourglass(false);
  });
});