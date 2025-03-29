// scripts/fetchTechnicalIndicators.js

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getDateRange(days = 90) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    startDate: formatDate(start),
    endDate: formatDate(end)
  };
}

/**
 * 根据传入的 URL 调用 Alpha Vantage API，并解析返回数据。
 * @param {string} url - API URL
 * @param {string} type - 指标名称
 * @param {object} keyMap - 字段映射对象
 * @param {string} start - 开始日期（YYYY-MM-DD）
 * @param {string} end - 结束日期（YYYY-MM-DD）
 * @returns {Promise<Array>} - 指标数据数组
 */
async function parseIndicator(url, type, keyMap, start, end) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data || data['Error Message'] || data.Information) {
      throw new Error(data['Error Message'] || data.Information || 'API调用失败');
    }

    const raw = data[`Technical Analysis: ${type}`];
    if (!raw) throw new Error(`未找到 ${type} 数据`);

    // 过滤日期范围并反转顺序，确保最旧的数据在前
    const list = Object.keys(raw)
      .filter(date => date >= start && date <= end)
      .reverse()
      .map(date => {
        const values = raw[date];
        const parsed = { date };
        // 将返回字段转换为小写并去除空格
        Object.entries(values).forEach(([k, v]) => {
          parsed[(keyMap[k] || k).replace(/[\s\-]/g, '').toLowerCase()] = parseFloat(v);
        });
        return parsed;
      });
//    console.log(`[DEBUG] ${type} 数据:`, list.slice(0, 3));
    return list;
  } catch (err) {
    console.error(`[指标] 获取 ${type} 失败:`, err.message);
    return [];
  }
}

// 以下各函数调用 parseIndicator() 并传入必要的参数
async function fetchMACD(symbol, start, end) {
  const url = `${BASE_URL}?function=MACD&symbol=${symbol}&interval=daily&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`;
  return parseIndicator(url, 'MACD', { 'MACD': 'macd', 'MACD_Signal': 'macdSignal', 'MACD_Hist': 'macdHist' }, start, end);
}

async function fetchRSI(symbol, start, end) {
  const url = `${BASE_URL}?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`;
  return parseIndicator(url, 'RSI', { 'RSI': 'rsi' }, start, end);
}

async function fetchOBV(symbol, start, end) {
  const url = `${BASE_URL}?function=OBV&symbol=${symbol}&interval=daily&apikey=${ALPHA_VANTAGE_API_KEY}`;
  return parseIndicator(url, 'OBV', { 'OBV': 'obv' }, start, end);
}

async function fetchCCI(symbol, start, end) {
  const url = `${BASE_URL}?function=CCI&symbol=${symbol}&interval=daily&time_period=20&apikey=${ALPHA_VANTAGE_API_KEY}`;
  return parseIndicator(url, 'CCI', { 'CCI': 'cci' }, start, end);
}

async function fetchSMA(symbol, start, end) {
  const url = `${BASE_URL}?function=SMA&symbol=${symbol}&interval=daily&time_period=20&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`;
  return parseIndicator(url, 'SMA', { 'SMA': 'sma' }, start, end);
}

async function fetchATR(symbol, start, end) {
  const url = `${BASE_URL}?function=ATR&symbol=${symbol}&interval=daily&time_period=14&apikey=${ALPHA_VANTAGE_API_KEY}`;
  return parseIndicator(url, 'ATR', { 'ATR': 'atr' }, start, end);
}

async function fetchADX(symbol, start, end) {
  const url = `${BASE_URL}?function=ADX&symbol=${symbol}&interval=daily&time_period=14&apikey=${ALPHA_VANTAGE_API_KEY}`;
  return parseIndicator(url, 'ADX', { 'ADX': 'adx' }, start, end);
}

async function fetchSTOCH(symbol, start, end) {
  const url = `${BASE_URL}?function=STOCH&symbol=${symbol}&interval=daily&apikey=${ALPHA_VANTAGE_API_KEY}`;
  return parseIndicator(url, 'STOCH', { 'SlowK': 'slowk', 'SlowD': 'slowd' }, start, end);
}

async function fetchBBANDS(symbol, start, end) {
  const url = `${BASE_URL}?function=BBANDS&symbol=${symbol}&interval=daily&time_period=20&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`;
  return parseIndicator(url, 'BBANDS', { 
    'Real Upper Band': 'bbupper', 
    'Real Lower Band': 'bblower', 
    'Real Middle Band': 'bbmiddle' 
  }, start, end);
}

// 取所有指标数据并合并
async function fetchAllTechnicalIndicators(symbol, days = 90) {
  const { startDate, endDate } = getDateRange(days);
//  console.log(`[技术指标] 获取数据范围：${startDate} 至 ${endDate}`);
  
  const results = await Promise.all([
    fetchMACD(symbol, startDate, endDate),
    fetchRSI(symbol, startDate, endDate),
    fetchOBV(symbol, startDate, endDate),
    fetchCCI(symbol, startDate, endDate),
    fetchBBANDS(symbol, startDate, endDate),
    fetchSMA(symbol, startDate, endDate),
    fetchATR(symbol, startDate, endDate),
    fetchADX(symbol, startDate, endDate),
    fetchSTOCH(symbol, startDate, endDate)
  ]);

  // 合并各指标数据（以日期为 key）
  const combined = {};
  results.flat().forEach(item => {
    if (!combined[item.date]) combined[item.date] = { date: item.date };
    Object.assign(combined[item.date], item);
  });

  const merged = Object.values(combined)
    .filter(d => d.date >= startDate && d.date <= endDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  console.log(`[技术指标] 合并后数据前3条:`, merged.slice(0, 3));
  return merged;
}

// 保存到 IndexedDB
async function saveTechnicalToDB(symbol, data) {
  try {
    await StockDB.saveStockData(symbol, data, 'TECHNICAL_INDICATOR');
    console.log('[技术指标] 保存成功:', `${symbol.toUpperCase()}_TECHNICAL_INDICATOR`);
  } catch (err) {
    console.error('[技术指标] 保存失败:', err.message);
  }
}

// 导出函数
window.fetchAllTechnicalIndicators = fetchAllTechnicalIndicators;
window.saveTechnicalToDB = saveTechnicalToDB;