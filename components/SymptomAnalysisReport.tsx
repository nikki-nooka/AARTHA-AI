import React, { useState, useEffect } from 'react';
import type { SymptomAnalysisResult } from '../types';
import { SummaryIcon, HazardIcon, ShieldCheckIcon, DiseaseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from './icons';

interface SymptomAnalysisReportProps {
  result: SymptomAnalysisResult;
  language: string;
}

const TriageIndicator: React.FC<{ result: SymptomAnalysisResult }> = ({ result }) => {
    const { triageLevel, triageRecommendation } = result;
    let bgColor = 'bg-green-50';
    let borderColor = 'border-green-400';
    let textColor = 'text-green-800';
    let iconColor = 'text-green-500';
    let label = 'Routine / Home Care';

    switch (triageLevel) {
        case 'emergency':
            bgColor = 'bg-red-50';
            borderColor = 'border-red-400';
            textColor = 'text-red-800';
            iconColor = 'text-red-500';
            label = 'EMERGENCY - Seek Immediate Care';
            break;
        case 'urgent':
            bgColor = 'bg-orange-50';
            borderColor = 'border-orange-400';
            textColor = 'text-orange-800';
            iconColor = 'text-orange-500';
            label = 'URGENT - Consult Doctor Soon';
            break;
        case 'routine':
            bgColor = 'bg-yellow-50';
            borderColor = 'border-yellow-400';
            textColor = 'text-yellow-800';
            iconColor = 'text-yellow-500';
            label = 'ROUTINE - Schedule Appointment';
            break;
        case 'home':
            bgColor = 'bg-green-50';
            borderColor = 'border-green-400';
            textColor = 'text-green-800';
            iconColor = 'text-green-500';
            label = 'HOME CARE - Monitor Symptoms';
            break;
    }

    return (
        <div className={`${bgColor} border-l-4 ${borderColor} ${textColor} p-4 rounded-r-lg shadow-sm`} role="alert">
            <div className="flex">
                <div className="py-1"><HazardIcon className={`w-6 h-6 ${iconColor} mr-3`} /></div>
                <div>
                    <p className="font-bold text-sm uppercase tracking-wider">{label}</p>
                    <p className="text-base font-medium mt-1">{triageRecommendation}</p>
                </div>
            </div>
        </div>
    );
};

export const SymptomAnalysisReport: React.FC<SymptomAnalysisReportProps> = ({ result, language }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(true);

  const getReportAsText = () => {
    return [
      `Triage Level: ${result.triageLevel}. Recommendation: ${result.triageRecommendation}`,
      `Symptom Summary: ${result.summary}`,
      `Potential Conditions for Discussion: ${(result.potentialConditions || []).map(c => `${c.name}. ${c.description}`).join('. ')}`,
      `Recommended Next Steps: ${(result.nextSteps || []).join('. ')}`,
      `Disclaimer: ${result.disclaimer}`
    ].join('\n\n');
  };

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length === 0) {
        return; // Voices might still be loading.
      }
      const langPrefix = language.split('-')[0];
      const filteredVoices = availableVoices.filter(v => v.lang.startsWith(langPrefix));
      setVoices(filteredVoices);
      setIsVoiceAvailable(filteredVoices.length > 0);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [language]);

  const speak = (text: string) => {
    if (!isVoiceAvailable || !('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const selectedVoice = voices.find(v => v.name.includes('Google')) || voices.find(v => v.default) || voices[0];
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = language;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };
  
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(getReportAsText());
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 animate-fade-in">
        <div className="p-4 sm:p-6 border-b border-slate-200/80 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Analysis Report</h2>
            <button
                onClick={handleToggleSpeak}
                disabled={!isVoiceAvailable}
                className="p-2 rounded-full transition-colors text-slate-500 hover:bg-slate-200 disabled:text-slate-300 disabled:cursor-not-allowed"
                title={!isVoiceAvailable ? "Voice output is not available for this language on your device" : (isSpeaking ? "Stop speaking" : "Read report aloud")}
                aria-label={isSpeaking ? "Stop speaking" : "Read report aloud"}
            >
                {isSpeaking ? <SpeakerXMarkIcon className="w-6 h-6 text-red-500" /> : <SpeakerWaveIcon className="w-6 h-6" />}
            </button>
        </div>
        <div className="p-4 sm:p-6 space-y-6">
            <TriageIndicator result={result} />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <SummaryIcon className="w-6 h-6 mr-3 mt-1 text-blue-500 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-base text-blue-800">Symptom Summary</h3>
                        <p className="mt-1 text-sm text-blue-700">{result.summary}</p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <DiseaseIcon className="w-6 h-6 text-slate-600"/>
                    Potential Conditions for Discussion
                </h3>
                <div className="space-y-3">
                    {(result.potentialConditions || []).map((condition, index) => (
                        <div key={index} className="bg-slate-50 p-3 rounded-md border-l-4 border-slate-400">
                           <p className="font-semibold text-sm text-slate-800">{condition.name}</p>
                           <p className="text-sm text-slate-600 mt-1">{condition.description}</p>
                        </div>
                    ))}
                    {(result.potentialConditions || []).length === 0 && (
                        <p className="text-sm text-slate-500">Based on your symptoms, no specific common conditions were highlighted. It's still best to consult a doctor.</p>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <ShieldCheckIcon className="w-6 h-6 text-green-500"/>
                    Recommended Next Steps
                </h3>
                <ul className="space-y-2 pl-2 text-sm text-slate-700">
                    {(result.nextSteps || []).map((step, index) => (
                        <li key={index} className="flex items-start gap-2.5">
                           <span className="text-green-500 mt-1">&#10003;</span> 
                           <span>{step}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4" role="alert">
                <div className="flex">
                    <div className="py-1"><HazardIcon className="w-6 h-6 text-red-500 mr-3"/></div>
                    <div>
                        <p className="font-bold">Important Disclaimer</p>
                        <p className="text-sm">{result.disclaimer}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};