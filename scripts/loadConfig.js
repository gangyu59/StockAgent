fetch('/api/get-config')
  .then(res => res.json())
  .then(config => {
    window.GPT_API_KEY = config.GPT_API_KEY;
    window.GPT_API_URL = config.GPT_API_URL;
    window.GPT_API_MODEL = config.GPT_API_MODEL;
    window.GPT_VISION_MODEL = config.GPT_VISION_MODEL;

    window.DEEPSEEK_API_KEY = config.DEEPSEEK_API_KEY;
    window.DEEPSEEK_API_URL = config.DEEPSEEK_API_URL;
    window.DEEPSEEK_API_MODEL = config.DEEPSEEK_API_MODEL;

    window.ARK_API_KEY = config.ARK_API_KEY;
    window.ARK_API_URL = config.ARK_API_URL;
    window.ARK_API_MODEL = config.ARK_API_MODEL;

    window.DALLE_API_KEY = config.DALLE_API_KEY;
    window.DALLE_API_URL = config.DALLE_API_URL;
    window.DALLE_API_MODEL = config.DALLE_API_MODEL;

    window.ALPHA_VANTAGE_API_KEY = config.ALPHA_VANTAGE_API_KEY;
    window.BASE_URL = config.BASE_URL;

    window.NEWS_API_KEY = config.NEWS_API_KEY;
    window.NEWS_API_URL = config.NEWS_API_URL;
  })
  .catch(err => {
    console.error('配置加载失败:', err);
  });