import React from 'react';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const sizeMap = {
    xs: { icon: 'w-6 h-6', text: 'text-base', sub: 'text-[9px]' },
    sm: { icon: 'w-8 h-8', text: 'text-lg', sub: 'text-[10px]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', sub: 'text-xs' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', sub: 'text-sm' },
    xl: { icon: 'w-20 h-20', text: 'text-4xl', sub: 'text-base' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Original BatchiT Emblem */}
      <div className={`relative ${currentSize.icon} flex items-center justify-center shrink-0`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-batchit-purple via-batchit-blue to-batchit-pink rounded-2xl opacity-80 blur-[6px]" />
        <div className="relative w-full h-full bg-batchit-card rounded-2xl border border-batchit-border flex items-center justify-center shadow-lg overflow-hidden group">
          <svg viewBox="0 0 100 100" className="w-4/5 h-4/5">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
            {/* Stylized Modern B / Shutter Lock */}
            <path
              d="M30 22 H54 C66 22 74 30 74 40 C74 47 69 52 62 54 C72 57 78 64 78 73 C78 83 69 90 56 90 H30 C26 90 23 87 23 83 V29 C23 25 26 22 30 22 Z"
              fill="none"
              stroke="url(#logoGrad)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="38" r="6" fill="#8B5CF6" />
            <circle cx="52" cy="72" r="7.5" fill="#EC4899" />
            <circle cx="34" cy="55" r="3.5" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tight text-white ${currentSize.text} flex items-center gap-1`}>
            Batch<span className="bg-gradient-to-r from-batchit-purple to-batchit-pink bg-clip-text text-transparent">iT</span>
          </span>
          <span className={`text-batchit-textSecondary font-medium tracking-wider uppercase ${currentSize.sub} mt-0.5`}>
            Private
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
