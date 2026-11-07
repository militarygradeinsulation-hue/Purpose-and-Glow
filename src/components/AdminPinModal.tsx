import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, Check, X, ShieldAlert } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

const CORRECT_PIN = '0313';

export function AdminPinModal({ isOpen, onSuccess, onClose }: AdminPinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setIsSuccess(false);
      setTimeout(() => hiddenInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4 || isSuccess) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(null);

    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const handleDelete = () => {
    if (isSuccess) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    if (isSuccess) return;
    setPin('');
    setError(null);
  };

  const verifyPin = (candidatePin: string) => {
    if (candidatePin === CORRECT_PIN) {
      setIsSuccess(true);
      setError(null);
      setTimeout(() => {
        onSuccess();
      }, 500);
    } else {
      setError('Incorrect security passcode. Please try again.');
      setTimeout(() => {
        setPin('');
      }, 700);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key >= '0' && e.key <= '9') {
      handleDigit(e.key);
    } else if (e.key === 'Backspace') {
      handleDelete();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Hidden input for physical keyboard focus */}
      <input
        ref={hiddenInputRef}
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
          setPin(val);
          setError(null);
          if (val.length === 4) verifyPin(val);
        }}
        className="opacity-0 absolute pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-sm bg-white dark:bg-[#141722] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#272F42] overflow-hidden transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          hiddenInputRef.current?.focus();
        }}
      >
        {/* Top Header Strip */}
        <div className="bg-[#FFF0F5] dark:bg-[#1C2232] border-b border-[#F0C6D6] dark:border-[#272F42] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#C2185B] text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2D2D2D] dark:text-white font-serif">Admin Workbench Access</h3>
              <p className="text-[11px] text-[#6E5A64] dark:text-slate-400">Purpose &amp; Glow Career Solutions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer transition-colors"
            title="Cancel and return to client site"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PIN Entry Area */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C2185B] dark:text-pink-400">Security Code</span>
            <p className="text-xs text-slate-600 dark:text-slate-400">Enter the 4-digit code to enter the lead qualification studio.</p>
          </div>

          {/* 4 Digit Boxes */}
          <div className="flex items-center justify-center gap-3">
            {[0, 1, 2, 3].map((idx) => {
              const char = pin[idx];
              const isCurrent = pin.length === idx;
              return (
                <div
                  key={idx}
                  className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-mono font-bold transition-all ${
                    isSuccess
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      : error
                      ? 'border-red-400 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                      : isCurrent
                      ? 'border-[#C2185B] dark:border-pink-500 bg-[#FFF0F5] dark:bg-pink-950/30 text-[#2D2D2D] dark:text-white scale-105 shadow-xs'
                      : char
                      ? 'border-slate-400 dark:border-slate-600 bg-white dark:bg-[#1E2333] text-[#2D2D2D] dark:text-white'
                      : 'border-slate-200 dark:border-[#272F42] bg-slate-50 dark:bg-[#181C28] text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {isSuccess ? (
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                  ) : char ? (
                    '●'
                  ) : (
                    '·'
                  )}
                </div>
              );
            })}
          </div>

          {/* Error / Status Feedback */}
          <div className="h-5 text-center">
            {error ? (
              <span className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {error}
              </span>
            ) : isSuccess ? (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Passcode verified. Opening studio...
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Press digits on keypad or type on keyboard</span>
            )}
          </div>

          {/* On-Screen Keypad for Fast 1-Click Access */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 dark:bg-[#1A1F2D] dark:hover:bg-[#232A3E] text-lg font-semibold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer border border-slate-200 dark:border-[#2A3144] shadow-2xs"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#1A1F2D] dark:hover:bg-[#232A3E] text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors cursor-pointer border border-slate-200 dark:border-[#2A3144]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 dark:bg-[#1A1F2D] dark:hover:bg-[#232A3E] text-lg font-semibold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer border border-slate-200 dark:border-[#2A3144] shadow-2xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#1A1F2D] dark:hover:bg-[#232A3E] text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-[#2A3144]"
              aria-label="Backspace"
            >
              ⌫
            </button>
          </div>

          {/* Security Note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Security clearance required</span>
            <span className="font-mono text-[11px] text-slate-400">4-Digit PIN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
