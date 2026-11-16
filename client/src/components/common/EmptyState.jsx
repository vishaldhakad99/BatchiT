import React from 'react';

const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto my-auto animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-batchit-card border border-batchit-border flex items-center justify-center text-batchit-purple mb-4 shadow-lg shadow-purple-500/5">
        {Icon && <Icon className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-batchit-textSecondary mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-batchit-purple to-batchit-blue text-white font-medium text-sm hover:opacity-95 transition-all shadow-md shadow-purple-500/20 active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
