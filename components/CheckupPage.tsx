import React from 'react';
import { BackButton } from './BackButton';

interface CheckupPageProps {
  onBack: () => void;
}

export const CheckupPage: React.FC<CheckupPageProps> = ({ onBack }) => {
  return (
    <div className="w-full min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 animate-fade-in bg-slate-50">
      <header className="w-full max-w-6xl mx-auto flex justify-start items-center mb-6">
        <BackButton onClick={onBack}>Back to Report</BackButton>
      </header>

      <main className="flex-grow flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          <div className="p-4 bg-green-50 border-b border-green-100 flex items-center justify-between">
            <h1 className="text-xl font-bold text-green-800">Personalized In-Person Visit Form</h1>
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Official Form</span>
          </div>
          <div className="relative w-full" style={{ height: '80vh' }}>
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLScaLSsnYzMgiCRfii-bGHGXkMhjBITsoTof1ovXwjfWY40Bxw/viewform?embedded=true"
              width="100%"
              height="100%"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              className="absolute inset-0"
            >
              Loading…
            </iframe>
          </div>
        </div>
        <p className="mt-4 text-slate-500 text-sm">
          Please complete all fields in the form above to schedule your visit.
        </p>
      </main>
    </div>
  );
};
