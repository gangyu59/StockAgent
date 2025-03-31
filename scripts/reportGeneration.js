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

async function generatePdfReport0(symbol, reportText) {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;

		console.log('开始生成 PDF：', symbol);
		
    // 加载字体
    const fontUrl = 'assets/fonts/NotoSansSC-Regular.ttf';
		console.log('准备加载字体...');
    const fontResponse = await fetch(fontUrl);
		console.log('字体响应结果:', fontResponse);
		if (!fontResponse.ok) {
		  throw new Error('字体文件加载失败：' + fontResponse.statusText);
		}
		const fontBytes = await fontResponse.arrayBuffer();
		console.log('字体加载完成，开始创建 PDF');
		
    // 创建 PDF 文档
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4大小
    const font = await pdfDoc.embedFont(fontBytes);

    const fontSize = 12;
    const lineHeight = 20;
    const margin = 40;
    const maxWidth = 515;
    let textY = 800;

    const lines = splitTextToLines(reportText, font, fontSize, maxWidth);

for (let line of lines) {
  if (textY < margin) {
    page = pdfDoc.addPage([595, 842]);
    textY = 800;
  }

  try {
    page.drawText(line, {
      x: margin,
      y: textY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0)
    });
  } catch (drawErr) {
    console.error('[drawText 出错] 当前行内容：', line);
    console.error(drawErr);
    throw drawErr; // 或者 continue 跳过当前行
  }

  textY -= lineHeight;
}

    const pdfBytes = await pdfDoc.save();

    // 触发下载
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${symbol}_投资报告.pdf`;
    link.click();
		console.log('PDF 已创建，开始下载...');
}

async function generatePdfReport(symbol, reportText) {
  try {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;

    console.log('[PDF] 开始生成英文报告 PDF：', symbol);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let page = pdfDoc.addPage([595, 842]); // A4尺寸

    const fontSizeNormal = 12;
    const fontSizeTitle = 16;
    const lineHeight = 20;
    const margin = 40;
    const maxWidth = 515;
    let textY = 800;

    const paragraphs = splitTextToParagraphs(reportText);
    console.log('[PDF] 段落数：', paragraphs.length);

    function drawTableRow(page, rowText, x, y, colWidths, font, fontSize) {
      const cols = rowText.split('|').map(col => col.trim());
      let xPos = x;

      for (let i = 0; i < cols.length; i++) {
        const colText = cols[i];
        page.drawText(colText, {
          x: xPos + 2,
          y,
          size: fontSize,
          font,
        });
        xPos += colWidths[i] || 100;
      }
    }

    for (let para of paragraphs) {
      if (textY < margin + lineHeight * 2) {
        page = pdfDoc.addPage([595, 842]);
        textY = 800;
      }

      // 表格检测与绘制
      if (para.includes('|')) {
        const tableLines = para.split('\n').filter(line => line.includes('|'));
        const colCount = tableLines[0].split('|').length;
        const colWidth = (maxWidth - 20) / colCount;
        const colWidths = new Array(colCount).fill(colWidth);

        for (let line of tableLines) {
          if (textY < margin + lineHeight) {
            page = pdfDoc.addPage([595, 842]);
            textY = 800;
          }
          drawTableRow(page, line, margin, textY, colWidths, font, fontSizeNormal);
          textY -= lineHeight;
        }
        textY -= 10;
        continue;
      }

      const isTitle = /^\d+\.\s/.test(para);
      const isSubTitle = /^[A-Z][A-Za-z\s]+:\s*/.test(para);
      const isBullet = /^-\s/.test(para);

      const fontSize = isTitle ? fontSizeTitle : fontSizeNormal;
      const indent = isBullet ? margin + 20 : isSubTitle ? margin + 15 : margin;
      const color = rgb(0, 0, 0);

      const lines = splitTextToLines(para, font, fontSize, maxWidth - (indent - margin));
      for (let line of lines) {
        if (textY < margin + lineHeight) {
          page = pdfDoc.addPage([595, 842]);
          textY = 800;
        }
        page.drawText(line, {
          x: indent,
          y: textY,
          size: fontSize,
          font,
          color,
        });
        textY -= lineHeight;
      }

      textY -= isTitle ? 8 : 10;
    }

    // 添加页码
    const pages = pdfDoc.getPages();
    pages.forEach((p, index) => {
      p.drawText(`Page ${index + 1}`, {
        x: 500,
        y: 20,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${symbol}_Investment_Report.pdf`;
    link.click();

    console.log('[PDF] 英文报告下载完成');
  } catch (err) {
    console.error('[PDF] 英文报告生成失败:', err);
    alert('PDF 下载失败，请稍后再试');
  }
}



function splitTextToParagraphs(text) {
  const result = [];
  const parts = text.split(/(?=\d+\.\s|[A-Z][a-z]+:|- )/g);
  for (let part of parts) {
    const trimmed = part.trim();
    if (trimmed) result.push(trimmed);
  }
  return result;
}

function splitTextToLines(text, font, fontSize, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width > maxWidth) {
      const wordCount = currentLine.trim().split(/\s+/).length;
      if (wordCount <= 2 && lines.length > 0) {
        lines[lines.length - 1] += ' ' + currentLine;
        currentLine = word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}


function drawTableRow(page, rowText, x, y, colWidths, font, fontSize) {
  const cols = rowText.split('|').map(col => col.trim());
  let xPos = x;

  for (let i = 0; i < cols.length; i++) {
    const colText = cols[i];
    page.drawText(colText, {
      x: xPos + 2,
      y,
      size: fontSize,
      font,
    });
    xPos += colWidths[i] || 100;
  }
}

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

    .trim();
}


function splitTextToLines(text, font, fontSize, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width > maxWidth) {
      const currentWordCount = currentLine.trim().split(/\s+/).length;

      if (currentWordCount <= 2 && lines.length > 0) {
        // 少于2个词，把这行并入上一行
        lines[lines.length - 1] += ' ' + currentLine;
        currentLine = word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
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

// 绑定“下载 PDF 报告”按钮事件（英文版）
document.getElementById('download-pdf-btn').addEventListener('click', async () => {
    const input = document.querySelector('input[type="text"]');
    if (!input || !input.value.trim()) {
        alert('请输入有效的股票代码');
        return;
    }

    const symbol = input.value.trim().toUpperCase();
    const key = `${symbol}_REPORT`;

    try {
        const record = await StockDB.loadStockData(symbol, 'REPORT');
        if (!record || !record.data) {
            alert(`未找到 ${symbol} 的分析报告，请先生成`);
            return;
        }

        const chineseText = record.data;
        const englishText = await translateTextToEnglish(chineseText);
        if (!englishText) {
            throw new Error('翻译失败或结果为空');
        }

				console.log("清理之前：", englishText);
        const cleanText = sanitizeText(englishText);
				console.log("清理之后：", cleanText);
				
				await generatePdfReport(symbol, cleanText);
    } catch (err) {
        console.error('[PDF] 报告生成失败:', err);
        alert('报告下载失败，请稍后再试');
    }
});