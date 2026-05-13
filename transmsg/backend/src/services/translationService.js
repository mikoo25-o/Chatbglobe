import axios from 'axios'

//
// SAFE TEXT
//
function normalizeText(text) {
  if (!text) return ''
  return String(text).trim().slice(0, 5000)
}

//
// DETECT LANGUAGE
//
export async function detectLanguage(text) {
  const safeText = normalizeText(text)

  if (!safeText) {
    return 'en'
  }

  //
  // AZURE
  //
  if (process.env.AZURE_TRANSLATOR_KEY) {
    try {
      const resp = await axios.post(
        `${process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com'}/detect?api-version=3.0`,
        [{ text: safeText.slice(0, 500) }],
        {
          headers: {
            'Ocp-Apim-Subscription-Key':
              process.env.AZURE_TRANSLATOR_KEY,

            'Ocp-Apim-Subscription-Region':
              process.env.AZURE_TRANSLATOR_REGION || 'global',

            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      return resp.data?.[0]?.language || 'en'
    } catch (err) {
      console.error(
        'Azure detect error:',
        err.response?.data || err.message
      )
    }
  }

  //
  // GOOGLE
  //
  if (process.env.GOOGLE_TRANSLATE_KEY) {
    try {
      const resp = await axios.post(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${process.env.GOOGLE_TRANSLATE_KEY}`,
        {
          q: safeText.slice(0, 500)
        },
        {
          timeout: 10000
        }
      )

      return (
        resp.data?.data?.detections?.[0]?.[0]?.language ||
        'en'
      )
    } catch (err) {
      console.error(
        'Google detect error:',
        err.response?.data || err.message
      )
    }
  }

  //
  // LIBRETRANSLATE
  //
  if (process.env.LIBRETRANSLATE_URL) {
    try {
      const resp = await axios.post(
        `${process.env.LIBRETRANSLATE_URL}/detect`,
        {
          q: safeText.slice(0, 500),
          api_key:
            process.env.LIBRETRANSLATE_API_KEY || ''
        },
        {
          timeout: 10000
        }
      )

      return resp.data?.[0]?.language || 'en'
    } catch (err) {
      console.error(
        'LibreTranslate detect error:',
        err.response?.data || err.message
      )
    }
  }

  //
  // FALLBACK
  //
  return 'en'
}

//
// TRANSLATE TEXT
//
export async function translateText(
  text,
  targetLang,
  sourceLang = null
) {
  const safeText = normalizeText(text)

  if (!safeText || !targetLang) {
    return null
  }

  //
  // SKIP SAME LANGUAGE
  //
  if (
    sourceLang &&
    sourceLang.toLowerCase() ===
      targetLang.toLowerCase()
  ) {
    return safeText
  }

  //
  // AZURE
  //
  if (process.env.AZURE_TRANSLATOR_KEY) {
    try {
      const params = new URLSearchParams({
        'api-version': '3.0',
        to: targetLang
      })

      if (sourceLang) {
        params.append('from', sourceLang)
      }

      const resp = await axios.post(
        `${process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com'}/translate?${params}`,
        [{ text: safeText }],
        {
          headers: {
            'Ocp-Apim-Subscription-Key':
              process.env.AZURE_TRANSLATOR_KEY,

            'Ocp-Apim-Subscription-Region':
              process.env.AZURE_TRANSLATOR_REGION || 'global',

            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      )

      return (
        resp.data?.[0]?.translations?.[0]?.text ||
        null
      )
    } catch (err) {
      console.error(
        'Azure translate error:',
        err.response?.data || err.message
      )
    }
  }

  //
  // GOOGLE
  //
  if (process.env.GOOGLE_TRANSLATE_KEY) {
    try {
      const payload = {
        q: safeText,
        target: targetLang,
        format: 'text'
      }

      if (sourceLang) {
        payload.source = sourceLang
      }

      const resp = await axios.post(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_KEY}`,
        payload,
        {
          timeout: 15000
        }
      )

      return (
        resp.data?.data?.translations?.[0]
          ?.translatedText || null
      )
    } catch (err) {
      console.error(
        'Google translate error:',
        err.response?.data || err.message
      )
    }
  }

  //
  // LIBRETRANSLATE
  //
  if (process.env.LIBRETRANSLATE_URL) {
    try {
      const resp = await axios.post(
        `${process.env.LIBRETRANSLATE_URL}/translate`,
        {
          q: safeText,
          source: sourceLang || 'auto',
          target: targetLang,
          api_key:
            process.env.LIBRETRANSLATE_API_KEY || ''
        },
        {
          timeout: 15000
        }
      )

      return resp.data?.translatedText || null
    } catch (err) {
      console.error(
        'LibreTranslate error:',
        err.response?.data || err.message
      )
    }
  }

  //
  // NO PROVIDER
  //
  return null
}