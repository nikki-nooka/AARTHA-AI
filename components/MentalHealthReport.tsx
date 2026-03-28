import React from 'react';
import type { MentalHealthResult } from '../types';
import { SummaryIcon, HazardIcon, ShieldCheckIcon, BrainCircuitIcon } from './icons';

interface MentalHealthReportProps {
  result: MentalHealthResult;
}

export const MentalHealthReport: React.FC<MentalHealthReportProps> = ({ result }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-6 animate-fade-in space-y-6">
        {/* Summary */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start">
                <SummaryIcon className="w-6 h-6 mr-3 mt-1 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-base text-indigo-800">Your Wellness Reflection</h3>
                    <p className="mt-1 text-sm text-indigo-700">{result.summary}</p>
                </div>
            </div>
        </div>

        {/* Potential Concerns */}
        <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <BrainCircuitIcon className="w-6 h-6 text-slate-600"/>
                Areas for Reflection
            </h3>
            <div className="space-y-3">
                {(result.potentialConcerns || []).map((concern, index) => (
                    <div key={index} className="bg-slate-50 p-3 rounded-md border-l-4 border-slate-400">
                       <p className="font-semibold text-sm text-slate-800">{concern.name}</p>
                       <p className="text-sm text-slate-600 mt-1">{concern.explanation}</p>
                    </div>
                ))}
                {(result.potentialConcerns || []).length === 0 && (
                    <p className="text-sm text-slate-500">Based on your answers, no specific areas of concern were highlighted at this time.</p>
                )}
            </div>
        </div>

        {/* Coping Strategies */}
        <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <ShieldCheckIcon className="w-6 h-6 text-green-500"/>
                Helpful Coping Strategies
            </h3>
            <div className="space-y-3">
                {(result.copingStrategies || []).map((strategy, index) => (
                    <div key={index} className="bg-green-50/70 p-3 rounded-md">
                       <p className="font-semibold text-sm text-green-800">{strategy.title}</p>
                       <p className="text-sm text-green-700 mt-1">{strategy.description}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Professional Recommendation */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4" role="alert">
            <div className="flex">
                <div className="py-1"><HazardIcon className="w-6 h-6 text-yellow-500 mr-3"/></div>
                <div>
                    <p className="font-bold">Important Disclaimer</p>
                    <p className="text-sm">{result.recommendation} This tool does not provide a medical diagnosis.</p>
                </div>
            </div>
        </div>
    </div>
  );
};
