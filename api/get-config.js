export default function handler(req, res) {
  res.status(200).json({
    GPT_API_KEY: process.env.GPT_API_KEY,
    GPT_API_URL: process.env.GPT_API_URL,
    GPT_API_MODEL: process.env.GPT_API_MODEL,
    GPT_VISION_MODEL: process.env.GPT_VISION_MODEL,

    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL,
    DEEPSEEK_API_MODEL: process.env.DEEPSEEK_API_MODEL,

    ARK_API_KEY: process.env.ARK_API_KEY,
    ARK_API_URL: process.env.ARK_API_URL,
    ARK_API_MODEL: process.env.ARK_API_MODEL,

    DALLE_API_KEY: process.env.DALLE_API_KEY,
    DALLE_API_URL: process.env.DALLE_API_URL,
    DALLE_API_MODEL: process.env.DALLE_API_MODEL,

    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
    BASE_URL: process.env.BASE_URL,

    NEWS_API_KEY: process.env.NEWS_API_KEY,
    NEWS_API_URL: process.env.NEWS_API_URL
  });
}