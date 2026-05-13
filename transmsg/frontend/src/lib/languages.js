export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' }
]

export const LANG_COLORS = {
  en: 'bg-blue-600/20 text-blue-400',
  es: 'bg-red-600/20 text-red-400',
  fr: 'bg-indigo-600/20 text-indigo-400',
  de: 'bg-yellow-600/20 text-yellow-400',
  zh: 'bg-red-700/20 text-red-300',
  ja: 'bg-pink-600/20 text-pink-400',
  ko: 'bg-purple-600/20 text-purple-400',
  ar: 'bg-green-600/20 text-green-400',
  pt: 'bg-emerald-600/20 text-emerald-400',
  ru: 'bg-orange-600/20 text-orange-400',
  vi: 'bg-yellow-700/20 text-yellow-300',
  sw: 'bg-green-700/20 text-green-300',
  default: 'bg-surface-600 text-surface-400'
}

export const getLangColor = (code) => LANG_COLORS[code] || LANG_COLORS.default
export const getLang = (code) => LANGUAGES.find(l => l.code === code) || { code, name: code, flag: '🌐' }
