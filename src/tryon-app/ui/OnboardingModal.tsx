import React, { useState } from 'react';
import { Camera, Sparkles, Move, CheckCircle2, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Step 1: Grant Camera Access',
      desc: 'Stylera uses your webcam to fit clothes directly on your body. Your stream never leaves this device.',
      icon: Camera,
      badge: '100% On-Device Privacy',
    },
    {
      title: 'Step 2: Drag & Drop Any Item',
      desc: 'Browse Myntra, Ajio, or any store. Drag any shirt, pants, sunglasses, or shoes onto this window.',
      icon: Move,
      badge: 'Auto Background Removal',
    },
    {
      title: 'Step 3: Real-Time Virtual Fit',
      desc: 'Move around! The clothes follow your pose and head rotation in real-time. Layer multiple items together.',
      icon: Sparkles,
      badge: '30 FPS WebGL Engine',
    },
  ];

  const currentStep = steps[step];
  const IconComponent = currentStep.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Step Indicator */}
        <div className="flex justify-center gap-1.5 mb-5">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === step ? 'w-8 bg-pink-500' : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Visual Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-pink-500/25">
          <IconComponent className="w-8 h-8" />
        </div>

        <div className="inline-block px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-semibold mb-2">
          {currentStep.badge}
        </div>

        <h3 className="text-base font-bold text-white mb-2">{currentStep.title}</h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-6">{currentStep.desc}</p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <button
            onClick={onComplete}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Skip Tutorial
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs shadow-md shadow-pink-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <span>{step === steps.length - 1 ? 'Get Started' : 'Next'}</span>
            {step === steps.length - 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
