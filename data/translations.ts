export const supportedLanguages = [
    { code: 'en-US', name: 'English' },
    { code: 'hi-IN', name: 'हिन्दी' },
    { code: 'bn-IN', name: 'বাংলা' },
    { code: 'te-IN', name: 'తెలుగు' },
    { code: 'mr-IN', name: 'मराठी' },
    { code: 'ta-IN', name: 'தமிழ்' },
    { code: 'ur-IN', name: 'اردو' },
    { code: 'gu-IN', name: 'ગુજરાતી' },
    { code: 'kn-IN', name: 'ಕನ್ನಡ' },
    { code: 'or-IN', name: 'ଓଡ଼ିଆ' },
    { code: 'ml-IN', name: 'മലയാളം' },
    { code: 'pa-IN', name: 'ਪੰਜਾਬੀ' },
    { code: 'as-IN', name: 'অসমীয়া' },
    { code: 'mai-IN', name: 'मैथिली' },
    { code: 'sat-IN', name: 'ᱥᱟᱱᱛᱟᱲᱤ' },
];

type TranslationDict = {
    [langCode: string]: string;
};

type Translations = {
    [key: string]: TranslationDict;
};

export const translations: Translations = {
    // Welcome Page
    'welcome_user': { 'en-US': 'Welcome, {name}!', 'hi-IN': 'स्वागत है, {name}!', 'te-IN': 'స్వాగతం, {name}!' },
    'what_today': { 'en-US': 'What would you like to do today?', 'hi-IN': 'आज आप क्या करना चाहेंगे?', 'te-IN': 'ఈరోజు మీరు ఏమి చేయాలనుకుంటున్నారు?' },
    'health_forecast': { 'en-US': 'HealthCast', 'hi-IN': 'हेल्थकास्ट', 'te-IN': 'హెల్త్‌కాస్ట్' },
    'health_forecast_desc': { 'en-US': 'Your daily health forecast', 'hi-IN': 'आपका दैनिक स्वास्थ्य पूर्वानुमान', 'te-IN': 'మీ రోజువారీ ఆరోగ్య సూచన' },
    'area_scan': { 'en-US': 'Area Scan', 'hi-IN': 'क्षेत्र स्कैन', 'te-IN': 'ఏరియా స్కాన్' },
    'area_scan_desc': { 'en-US': 'Analyze surroundings for risks', 'hi-IN': 'जोखिमों के लिए परिवेश का विश्लेषण करें', 'te-IN': 'ప్రమాదాల కోసం పరిసరాలను విశ్లేషించండి' },
    'symptom_checker': { 'en-US': 'Symptom Checker', 'hi-IN': 'लक्षण परीक्षक', 'te-IN': 'లక్షణాల తనిఖీ' },
    'symptom_checker_desc': { 'en-US': 'Get AI-driven insights', 'hi-IN': 'एआई-संचालित अंतर्दृष्टि प्राप्त करें', 'te-IN': 'AI-ఆధారిత అంతర్దృష్టులను పొందండి' },
    'script_reader': { 'en-US': 'Script Reader', 'hi-IN': 'स्क्रिप्ट रीडर', 'te-IN': 'స్క్రిప్ట్ రీడర్' },
    'script_reader_desc': { 'en-US': 'Interpret prescriptions easily', 'hi-IN': 'नुस्खे की आसानी से व्याख्या करें', 'te-IN': 'ప్రిస్క్రిప్షన్‌లను సులభంగా అర్థం చేసుకోండి' },
    'water_log': { 'en-US': 'Water Log', 'hi-IN': 'पानी का लॉग', 'te-IN': 'వాటర్ లాగ్' },
    'water_log_desc': { 'en-US': 'Track your daily intake', 'hi-IN': 'अपने दैनिक सेवन को ट्रैक करें', 'te-IN': 'మీ రోజువారీ వినియోగాన్ని ట్రాక్ చేయండి' },
    'mind_check': { 'en-US': 'Mind Check', 'hi-IN': 'माइंड चेक', 'te-IN': 'మైండ్ చెక్' },
    'mind_check_desc': { 'en-US': 'Reflect on your well-being', 'hi-IN': 'अपनी भलाई पर चिंतन करें', 'te-IN': 'మీ శ్రేయస్సును ప్రతిబింబించండి' },
    
    // Sidebar
    'dashboard': { 'en-US': 'Dashboard', 'hi-IN': 'डैशबोर्ड', 'te-IN': 'డాష్‌బోర్డ్' },
    'activity_history': { 'en-US': 'Activity History', 'hi-IN': 'गतिविधि इतिहास', 'te-IN': 'కార్యాచరణ చరిత్ర' },
    'my_profile': { 'en-US': 'My Profile', 'hi-IN': 'मेरी प्रोफाइल', 'te-IN': 'నా ప్రొఫైల్' },
    'admin_dashboard': { 'en-US': 'Admin Dashboard', 'hi-IN': 'एडमिन डैशबोर्ड', 'te-IN': 'అడ్మిన్ డాష్‌బోర్డ్' },
    'feedback_review': { 'en-US': 'Feedback & Review', 'hi-IN': 'प्रतिक्रिया और समीक्षा', 'te-IN': 'అభిప్రాయం & సమీక్ష' },
    'logout': { 'en-US': 'Logout', 'hi-IN': 'लॉग आउट', 'te-IN': 'లాగ్ అవుట్' },
    'language': { 'en-US': 'Language', 'hi-IN': 'भाषा', 'te-IN': 'భాష' },
    
    // Homepage
    'about': { 'en-US': 'About', 'hi-IN': 'हमारे बारे में', 'te-IN': 'మా గురించి' },
    'contact': { 'en-US': 'Contact', 'hi-IN': 'संपर्क', 'te-IN': 'సంప్రదించండి' },
    'login': { 'en-US': 'Login', 'hi-IN': 'लॉग इन करें', 'te-IN': 'లాగిన్' },
    'explore_globe': { 'en-US': 'Explore the Globe', 'hi-IN': 'ग्लोब का अन्वेषण करें', 'te-IN': 'గ్లోబ్‌ను అన్వేషించండి' },
    'get_started': { 'en-US': 'Get Started', 'hi-IN': 'शुरू करें', 'te-IN': 'ప్రారంభించండి' },
    'homepage_subtitle': {'en-US': 'Explore the globe, uncover hidden environmental risks, and protect communities with AI-powered health insights.', 'hi-IN': 'ग्लोब का अन्वेषण करें, छिपे हुए पर्यावरणीय जोखिमों को उजागर करें, और एआई-संचालित स्वास्थ्य अंतर्दृष्टि के साथ समुदायों की रक्षा करें।', 'te-IN': 'గ్లోబ్‌ను అన్వేషించండి, దాచిన పర్యావరణ ప్రమాదాలను వెలికితీయండి మరియు AI-ఆధారిత ఆరోగ్య అంతర్దృష్టులతో సంఘాలను రక్షించండి.'},
    
    // ChatBot
    'chatbot_welcome': { 'en-US': 'Hello! I am your voice assistant. You can ask me questions or tell me where to go, like "go to the symptom checker".', 'hi-IN': 'नमस्ते! मैं आपका वॉयस असिस्टेंट हूं। आप मुझसे सवाल पूछ सकते हैं या मुझे बता सकते हैं कि कहां जाना है, जैसे "लक्षण परीक्षक पर जाएं"।', 'te-IN': 'నమస్కారం! నేను మీ వాయిస్ అసిస్టెంట్‌ని. మీరు నన్ను ప్రశ్నలు అడగవచ్చు లేదా "లక్షణ తనిఖీకి వెళ్లండి" వంటివి ఎక్కడికి వెళ్లాలో చెప్పవచ్చు.' },
    'chatbot_placeholder_ask': { 'en-US': 'Ask or give a command...', 'hi-IN': 'पूछें या कमांड दें...', 'te-IN': 'అడగండి లేదా ఆదేశం ఇవ్వండి...' },
    'chatbot_placeholder_listening': { 'en-US': 'Listening...', 'hi-IN': 'सुन रहा हूँ...', 'te-IN': 'వింటున్నాను...' },
    'language_label': { 'en-US': 'Language: {lang}', 'hi-IN': 'भाषा: {lang}', 'te-IN': 'భాష: {lang}' },
    'voice_not_available': { 'en-US': 'Voice output is not available for this language on your device', 'hi-IN': 'आपके डिवाइस पर इस भाषा के लिए वॉयస్ అవుట్‌పుట్ ઉપલબ્ધ નથી', 'te-IN': 'మీ పరికరంలో ఈ భాషకు వాయిస్ అవుట్‌పుట్ అందుబాటులో లేదు' },
    'unmute': { 'en-US': 'Unmute', 'hi-IN': 'अनम्यूट', 'te-IN': 'అన్‌మ్యూట్ చేయండి' },
    'mute': { 'en-US': 'Mute', 'hi-IN': 'म्यूट', 'te-IN': 'మ్యూట్ చేయండి' },
    'chatbot_error': { 'en-US': 'Sorry, I encountered an error. Please try again.', 'hi-IN': 'क्षमा करें, मुझे एक त्रुटि मिली। कृपया पुन: प्रयास करें।', 'te-IN': 'క్షమించండి, నాకు ఒక దోషం ఎదురైంది. దయచేసి మళ్లీ ప్రయత్నించండి.' },
    'clear_chat': { 'en-US': 'Clear Chat History', 'hi-IN': 'चैट इतिहास साफ़ करें', 'te-IN': 'చాట్ చరిత్రను క్లియర్ చేయండి' },
    
    // Symptom Checker Page
    'symptom_checker_title': { 'en-US': 'AI Symptom Checker', 'hi-IN': 'एआई लक्षण परीक्षक', 'te-IN': 'AI లక్షణాల తనిఖీ' },
    'symptom_disclaimer_short': { 'en-US': 'This is not a medical diagnosis. Always consult a healthcare professional for advice.', 'hi-IN': 'यह एक चिकित्सा निदान नहीं है। सलाह के लिए हमेशा एक स्वास्थ्य देखभाल पेशेवर से परामर्श करें।', 'te-IN': 'ఇది వైద్య నిర్ధారణ కాదు. సలహా కోసం ఎల్లప్పుడూ ఆరోగ్య సంరక్షణ నిపుణుడిని సంప్రదించండి.' },
    'symptom_describe_label': { 'en-US': 'Describe your symptoms', 'hi-IN': 'अपने लक्षणों का वर्णन करें', 'te-IN': 'మీ లక్షణాలను వివరించండి' },
    'symptom_describe_detail': { 'en-US': 'Be as detailed as possible. Include when they started and how you feel.', 'hi-IN': 'जितना संभव हो उतना विस्तृत रहें। बताएं कि वे कब शुरू हुए और आप कैसा महसूस करते हैं।', 'te-IN': 'సాధ్యమైనంత వివరంగా ఉండండి. అవి ఎప్పుడు ప్రారంభమయ్యాయో మరియు మీకు ఎలా అనిపిస్తుందో చేర్చండి.' },
    'symptom_placeholder_example': { 'en-US': "e.g., 'I have a sore throat, headache, and have been feeling tired for 3 days...'", 'hi-IN': "उदा., 'मेरे गले में खराश, सिरदर्द है, और 3 दिनों से थकान महसूस हो रही है...'", 'te-IN': "ఉదా., 'నాకు గొంతు నొప్పి, తలనొప్పి ఉంది, మరియు 3 రోజులుగా అలసిపోయినట్లు అనిపిస్తోంది...'" },
    'symptom_placeholder_listening': { 'en-US': 'Listening... I am ready to hear your symptoms.', 'hi-IN': 'सुन रहा हूँ... मैं आपके लक्षण सुनने के लिए तैयार हूँ।', 'te-IN': 'వింటున్నాను... మీ లక్షణాలను వినడానికి నేను సిద్ధంగా ఉన్నాను.' },
    'symptom_analyze_button': { 'en-US': 'Analyze My Symptoms', 'hi-IN': 'मेरे लक्षणों का विश्लेषण करें', 'te-IN': 'నా లక్షణాలను విశ్లేషించండి' },
    'symptom_analyzing_button': { 'en-US': 'Analyzing...', 'hi-IN': 'विश्लेषण हो रहा है...', 'te-IN': 'విశ్లేషిస్తోంది...' },
    'symptom_error_short_input': { 'en-US': 'Please provide a more detailed description of your symptoms (at least 10 characters).', 'hi-IN': 'कृपया अपने लक्षणों का अधिक विस्तृत विवरण प्रदान करें (कम से कम 10 अक्षर)।', 'te-IN': 'దయచేసి మీ లక్షణాల యొక్క మరింత వివరణాత్మక వర్ణనను అందించండి (కనీసం 10 అక్షరాలు).' },
    'start_new_analysis': { 'en-US': 'Start a New Analysis', 'hi-IN': 'एक नया विश्लेषण शुरू करें', 'te-IN': 'కొత్త విశ్లేషణను ప్రారంభించండి' }
};