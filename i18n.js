// Interface labels in English, Hindi and Kannada.
// NOTE: Hindi and Kannada labels were written by the developer; have a fluent speaker review them.
export const LANGS = { en: "English", hi: "हिन्दी", kn: "ಕನ್ನಡ" };

const T = {
  en: {
    appName: "JanSahayak AI", tagline: "Understand government schemes in simple language",
    home: "Home", dashboard: "Dashboard", chat: "Ask AI", explore: "Explore Schemes", recommend: "For You",
    compare: "Compare", profile: "Profile", admin: "Admin", login: "Login", register: "Register", logout: "Logout",
    askPlaceholder: "Ask about a scheme, e.g. What documents are needed for PM-KISAN?", send: "Send", thinking: "Searching official sources…",
    sources: "Sources used", noSources: "No sources", helpful: "Helpful", report: "Report incorrect / outdated",
    disclaimer: "Informational assistance only. This is not an official eligibility decision. Confirm details with the concerned government authority.",
    search: "Search schemes", allCategories: "All categories", viewDetails: "View details", addCompare: "Add to compare",
    benefits: "Benefits", eligibility: "Eligibility", documents: "Documents required", howToApply: "How to apply",
    officialSite: "Official website", sourceUrl: "Source", lastVerified: "Last verified", clearChat: "Clear chat",
    language: "Response language", save: "Save", email: "Email", password: "Password", name: "Name",
  },
  hi: {
    appName: "जनसहायक AI", tagline: "सरकारी योजनाओं को सरल भाषा में समझें",
    home: "मुख्य पृष्ठ", dashboard: "डैशबोर्ड", chat: "AI से पूछें", explore: "योजनाएँ देखें", recommend: "आपके लिए",
    compare: "तुलना", profile: "प्रोफ़ाइल", admin: "एडमिन", login: "लॉगिन", register: "पंजीकरण", logout: "लॉगआउट",
    askPlaceholder: "किसी योजना के बारे में पूछें, जैसे PM-KISAN के लिए कौन से दस्तावेज़ चाहिए?", send: "भेजें", thinking: "आधिकारिक स्रोतों में खोज रहे हैं…",
    sources: "उपयोग किए गए स्रोत", noSources: "कोई स्रोत नहीं", helpful: "उपयोगी", report: "गलत / पुरानी जानकारी बताएँ",
    disclaimer: "यह केवल सूचनात्मक सहायता है। यह आधिकारिक पात्रता निर्णय नहीं है। विवरण की पुष्टि संबंधित सरकारी प्राधिकरण से करें।",
    search: "योजनाएँ खोजें", allCategories: "सभी श्रेणियाँ", viewDetails: "विवरण देखें", addCompare: "तुलना में जोड़ें",
    benefits: "लाभ", eligibility: "पात्रता", documents: "आवश्यक दस्तावेज़", howToApply: "आवेदन कैसे करें",
    officialSite: "आधिकारिक वेबसाइट", sourceUrl: "स्रोत", lastVerified: "अंतिम सत्यापन", clearChat: "चैट साफ़ करें",
    language: "उत्तर की भाषा", save: "सहेजें", email: "ईमेल", password: "पासवर्ड", name: "नाम",
  },
  kn: {
    appName: "ಜನಸಹಾಯಕ AI", tagline: "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಸರಳ ಭಾಷೆಯಲ್ಲಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ",
    home: "ಮುಖಪುಟ", dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", chat: "AI ಕೇಳಿ", explore: "ಯೋಜನೆಗಳು", recommend: "ನಿಮಗಾಗಿ",
    compare: "ಹೋಲಿಕೆ", profile: "ಪ್ರೊಫೈಲ್", admin: "ನಿರ್ವಾಹಕ", login: "ಲಾಗಿನ್", register: "ನೋಂದಣಿ", logout: "ಲಾಗ್‌ಔಟ್",
    askPlaceholder: "ಯೋಜನೆಯ ಬಗ್ಗೆ ಕೇಳಿ, ಉದಾ: PM-KISAN ಗೆ ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?", send: "ಕಳುಹಿಸಿ", thinking: "ಅಧಿಕೃತ ಮೂಲಗಳಲ್ಲಿ ಹುಡುಕಲಾಗುತ್ತಿದೆ…",
    sources: "ಬಳಸಿದ ಮೂಲಗಳು", noSources: "ಮೂಲಗಳಿಲ್ಲ", helpful: "ಉಪಯುಕ್ತ", report: "ತಪ್ಪು / ಹಳೆಯ ಮಾಹಿತಿ ವರದಿ ಮಾಡಿ",
    disclaimer: "ಇದು ಮಾಹಿತಿ ಸಹಾಯ ಮಾತ್ರ. ಇದು ಅಧಿಕೃತ ಅರ್ಹತಾ ನಿರ್ಧಾರವಲ್ಲ. ವಿವರಗಳನ್ನು ಸಂಬಂಧಿತ ಸರ್ಕಾರಿ ಪ್ರಾಧಿಕಾರದಿಂದ ದೃಢಪಡಿಸಿಕೊಳ್ಳಿ.",
    search: "ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ", allCategories: "ಎಲ್ಲಾ ವರ್ಗಗಳು", viewDetails: "ವಿವರ ನೋಡಿ", addCompare: "ಹೋಲಿಕೆಗೆ ಸೇರಿಸಿ",
    benefits: "ಪ್ರಯೋಜನಗಳು", eligibility: "ಅರ್ಹತೆ", documents: "ಅಗತ್ಯ ದಾಖಲೆಗಳು", howToApply: "ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ವಿಧಾನ",
    officialSite: "ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್", sourceUrl: "ಮೂಲ", lastVerified: "ಕೊನೆಯ ಪರಿಶೀಲನೆ", clearChat: "ಚಾಟ್ ತೆರವುಗೊಳಿಸಿ",
    language: "ಉತ್ತರದ ಭಾಷೆ", save: "ಉಳಿಸಿ", email: "ಇಮೇಲ್", password: "ಪಾಸ್‌ವರ್ಡ್", name: "ಹೆಸರು",
  },
};

export const makeT = (lang) => (key) => T[lang]?.[key] ?? T.en[key] ?? key;
