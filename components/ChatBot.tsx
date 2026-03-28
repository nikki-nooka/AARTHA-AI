import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { getBotCommand } from '../services/geminiService';
import { supabase } from '../src/lib/supabase';
import type { ChatMessage, Page, User } from '../types';
import { BotIcon, SendIcon, CloseIcon, ChevronDownIcon, MicrophoneIcon, SpeakerWaveIcon, SpeakerXMarkIcon, SparklesIcon, TrashIcon } from './icons';
import { useI18n } from './I18n';
import { supportedLanguages } from '../data/translations';
import { LanguageSelector } from './LanguageSelector';

interface ChatBotProps {
    onNavigate: (page: Page) => void;
    user: User | null;
}

// Manually defining SpeechRecognition for browsers that support it to resolve TypeScript error.
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

// For cross-browser compatibility
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const ChatBot: React.FC<ChatBotProps> = ({ onNavigate, user }) => {
    const CHATS_STORAGE_KEY = 'geosick_chat_history';
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { language: selectedLanguage, t } = useI18n();
    
    const [isListening, setIsListening] = useState(false);
    const [wasVoiceInput, setWasVoiceInput] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const isSpeechSupported = !!SpeechRecognitionAPI;

    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
    const [isVoiceAvailable, setIsVoiceAvailable] = useState(true);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Load messages from localStorage on mount
    useEffect(() => {
        const savedMessages = localStorage.getItem(CHATS_STORAGE_KEY);
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                }
            } catch (e) {
                console.error("Failed to parse saved messages", e);
            }
        }
    }, []);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const initialMessage: ChatMessage = { id: 'initial', role: 'bot', text: t('chatbot_welcome') };
            setMessages([initialMessage]);
        }
    }, [isOpen, messages.length, t]);
    
    useEffect(() => {
        // This effect is for loading voices for TTS
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();

            if (availableVoices.length === 0) {
                setVoices([]);
                setSelectedVoiceURI(null);
                setIsVoiceAvailable(false);
                return;
            }

            const langPrefix = selectedLanguage.split('-')[0];
            const filteredVoices = availableVoices.filter(v => v.lang.startsWith(langPrefix));
            setVoices(filteredVoices);

            if (filteredVoices.length > 0) {
                const defaultVoice = filteredVoices.find(v => v.name.includes('Google')) || filteredVoices.find(v => v.default) || filteredVoices[0];
                setSelectedVoiceURI(defaultVoice.voiceURI);
                setIsVoiceAvailable(true);
            } else {
                setSelectedVoiceURI(null);
                setIsVoiceAvailable(false);
            }
        };

        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); 

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            window.speechSynthesis.cancel();
        };
    }, [selectedLanguage]);

    const speak = (text: string) => {
        if (isMuted || !isVoiceAvailable || !('speechSynthesis' in window) || !text) return;
        window.speechSynthesis.cancel();
        
        const cleanedText = text.replace(/[*#_`]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        
        const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.lang = selectedLanguage;
        utterance.rate = 1.05; // Slightly faster for responsiveness
        utterance.pitch = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        setTimeout(() => window.speechSynthesis.speak(utterance), 100);
    };

    useEffect(() => {
        if (!isSpeechSupported) return;

        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.stop();
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true; 
        recognition.lang = selectedLanguage;

        recognition.onresult = (event: any) => {
            let fullTranscript = '';
            let isFinal = false;
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    isFinal = true;
                }
            }
            setInput(fullTranscript);

            // Auto-send logic: if we have a final result, wait a bit for more speech, then send
            if (isFinal) {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                    handleSend(true);
                }, 1500);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };
        
        recognition.onend = () => setIsListening(false);
        
        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        };
    }, [isSpeechSupported, selectedLanguage]);

    useLayoutEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (isVoice: boolean = false) => {
        const currentInput = input.trim();
        if (currentInput === '' || isLoading) return;
        
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();

        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const userMessageText = currentInput;
        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: userMessageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setWasVoiceInput(isVoice);

        const botMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMessageId, role: 'bot', text: '...' }]);

        try {
            const availablePages: Page[] = ['welcome', 'image-analysis', 'prescription-analysis', 'mental-health', 'symptom-checker', 'activity-history', 'profile', 'about', 'contact', 'explore', 'partners', 'checkup', 'water-log', 'admin-dashboard', 'health-briefing'];
            const languageName = supportedLanguages.find(l => l.code === selectedLanguage)?.name || 'English';
            
            const commandResponse = await getBotCommand(userMessageText, languageName, availablePages);
            
            setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: commandResponse.responseText } : msg));
            
            // Sync with Supabase
            if (user) {
                supabase.from('activity_history').insert({
                    user_phone: user.phone,
                    type: 'chatbot',
                    title: 'Chatbot interaction',
                    data: { userMessage: userMessageText, botResponse: commandResponse.responseText, action: commandResponse.action, page: commandResponse.page },
                    timestamp: new Date().toISOString()
                }).then(({ error }) => {
                    if (error) console.error("Supabase chatbot sync error:", error);
                });
            }

            // Only speak if it was voice input OR if not muted
            if (isVoice || !isMuted) {
                speak(commandResponse.responseText);
            }
            
            if (commandResponse.action === 'navigate' && commandResponse.page) {
                setTimeout(() => {
                    onNavigate(commandResponse.page!);
                    setIsOpen(false);
                }, 1500);
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            const errorText = t('chatbot_error');
            setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: errorText } : msg));
            speak(errorText);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = () => {
        const initialMessage: ChatMessage = { id: 'initial', role: 'bot', text: t('chatbot_welcome') };
        setMessages([initialMessage]);
        localStorage.removeItem(CHATS_STORAGE_KEY);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };

    const handleToggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            recognitionRef.current.stop();
            if (input.trim()) handleSend(true);
        } else {
            setInput('');
            setWasVoiceInput(true);
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Could not start recognition:", e);
                setIsListening(false);
            }
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 text-white rounded-full p-3 shadow-lg transition-all transform hover:scale-110 z-50 ${
                    isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'
                }`}
                aria-label="Toggle Chatbot"
            >
                {isOpen ? <CloseIcon className="w-7 h-7"/> : (isSpeaking ? <SpeakerWaveIcon className="w-7 h-7" /> : <SparklesIcon className="w-7 h-7" />)}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[90vw] max-w-sm h-[70vh] max-h-[550px] bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col z-40 animate-fade-in-up">
                    <header className="p-3 flex justify-between items-center rounded-t-lg border-b border-slate-200">
                         <div className="w-32">
                            <LanguageSelector variant="chatbot" />
                         </div>
                         <div className="flex items-center gap-3">
                            <button 
                                onClick={handleClearChat}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title={t('clear_chat')}
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setIsMuted(!isMuted)} 
                                className="text-slate-400 hover:text-slate-600 disabled:text-slate-300 disabled:cursor-not-allowed"
                                aria-label={isMuted ? t('unmute') : t('mute')}
                                disabled={!isVoiceAvailable}
                                title={!isVoiceAvailable ? t('voice_not_available') : (isMuted ? t('unmute') : t('mute'))}
                            >
                                {isMuted || !isVoiceAvailable ? <SpeakerXMarkIcon className="w-6 h-6" /> : <SpeakerWaveIcon className="w-6 h-6" />}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <ChevronDownIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 {msg.role === 'bot' && (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSpeaking && msg.id === messages[messages.length - 1]?.id ? 'bg-green-100 animate-pulse' : 'bg-slate-200'}`}>
                                        {isSpeaking && msg.id === messages[messages.length - 1]?.id ? <SpeakerWaveIcon className="w-5 h-5 text-green-600" /> : <BotIcon className="w-5 h-5 text-slate-500" />}
                                    </div>
                                )}
                                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-lg' : 'bg-slate-200 text-slate-800 rounded-bl-lg'}`}>
                                    <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                         {isLoading && messages[messages.length - 1]?.role !== 'bot' && (
                             <div className="flex items-end gap-2 justify-start">
                                 <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0"><BotIcon className="w-5 h-5 text-slate-500" /></div>
                                 <div className="max-w-[80%] p-3 rounded-2xl bg-slate-200 text-slate-800 rounded-bl-lg">...</div>
                             </div>
                         )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 border-t border-slate-200 bg-white">
                        <div className="flex items-center bg-slate-100 rounded-lg">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={isListening ? t('chatbot_placeholder_listening') : t('chatbot_placeholder_ask')}
                                className="flex-1 bg-transparent py-2 px-3 text-slate-800 placeholder-slate-400 focus:outline-none"
                                disabled={isLoading}
                            />
                            {isSpeechSupported ? (
                                <button
                                    onClick={handleToggleListening}
                                    disabled={isLoading}
                                    className={`p-2 transition-colors ${
                                        isListening ? 'text-red-500 animate-pulse' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                    aria-label={isListening ? 'Stop listening' : 'Start listening'}
                                >
                                    <MicrophoneIcon className="w-6 h-6" />
                                </button>
                            ) : (
                                 <button
                                    className="p-2 text-slate-400 cursor-not-allowed"
                                    title="Voice input is not supported by your browser."
                                    disabled
                                >
                                    <MicrophoneIcon className="w-6 h-6" />
                                </button>
                            )}
                            <button onClick={() => handleSend(false)} disabled={isLoading || !input} className="p-2 text-blue-500 disabled:text-slate-400 hover:text-blue-600 transition-colors">
                                <SendIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};