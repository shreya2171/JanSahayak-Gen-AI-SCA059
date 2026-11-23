"""Fixed user-facing messages in English, Hindi and Kannada.

NOTE FOR REVIEW: the Hindi and Kannada strings were written by the developer
and should be checked by a fluent speaker before real-world use.
"""
LANG_NAMES = {"en": "English", "hi": "Hindi", "kn": "Kannada"}

NOT_FOUND = {
    "en": "I could not find enough information about this in the knowledge base, so I cannot answer reliably. Please check the official government website or your nearest government office.",
    "hi": "मुझे इस विषय पर ज्ञान-आधार में पर्याप्त जानकारी नहीं मिली, इसलिए मैं भरोसेमंद उत्तर नहीं दे सकता। कृपया आधिकारिक सरकारी वेबसाइट या अपने नज़दीकी सरकारी कार्यालय से जानकारी लें।",
    "kn": "ಈ ಬಗ್ಗೆ ಜ್ಞಾನ ಭಂಡಾರದಲ್ಲಿ ಸಾಕಷ್ಟು ಮಾಹಿತಿ ಸಿಗಲಿಲ್ಲ, ಆದ್ದರಿಂದ ನಾನು ವಿಶ್ವಾಸಾರ್ಹ ಉತ್ತರ ನೀಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ವೆಬ್‌ಸೈಟ್ ಅಥವಾ ಹತ್ತಿರದ ಸರ್ಕಾರಿ ಕಚೇರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
}

LLM_DOWN = {
    "en": "The language model is not running right now, so I could not write a full answer. The most relevant passages from official sources are shown below.",
    "hi": "भाषा मॉडल अभी चालू नहीं है, इसलिए मैं पूरा उत्तर नहीं लिख सका। आधिकारिक स्रोतों के सबसे प्रासंगिक अंश नीचे दिखाए गए हैं।",
    "kn": "ಭಾಷಾ ಮಾದರಿ ಈಗ ಚಾಲನೆಯಲ್ಲಿಲ್ಲ, ಆದ್ದರಿಂದ ಪೂರ್ಣ ಉತ್ತರ ಬರೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಅಧಿಕೃತ ಮೂಲಗಳ ಅತ್ಯಂತ ಸಂಬಂಧಿತ ಭಾಗಗಳನ್ನು ಕೆಳಗೆ ತೋರಿಸಲಾಗಿದೆ.",
}

DISCLAIMER = {
    "en": "This is informational assistance only and not an official eligibility decision. Please confirm details with the concerned government authority.",
    "hi": "यह केवल सूचनात्मक सहायता है, आधिकारिक पात्रता निर्णय नहीं। कृपया संबंधित सरकारी प्राधिकरण से विवरण की पुष्टि करें।",
    "kn": "ಇದು ಮಾಹಿತಿ ಸಹಾಯ ಮಾತ್ರ, ಅಧಿಕೃತ ಅರ್ಹತಾ ನಿರ್ಧಾರವಲ್ಲ. ದಯವಿಟ್ಟು ಸಂಬಂಧಿತ ಸರ್ಕಾರಿ ಪ್ರಾಧಿಕಾರದಿಂದ ವಿವರಗಳನ್ನು ದೃಢಪಡಿಸಿಕೊಳ್ಳಿ.",
}
