import React from 'react';

export const MessageSkeleton = () => (
  <div className="flex flex-col gap-3 p-4 animate-pulse">
    <div className="flex items-end gap-2.5 max-w-[70%]">
      <div className="w-8 h-8 rounded-full bg-batchit-card shrink-0" />
      <div className="h-10 bg-batchit-card rounded-2xl rounded-bl-sm w-48" />
    </div>
    <div className="flex items-end gap-2.5 max-w-[70%] self-end">
      <div className="h-14 bg-batchit-border rounded-2xl rounded-br-sm w-64" />
    </div>
    <div className="flex items-end gap-2.5 max-w-[70%]">
      <div className="w-8 h-8 rounded-full bg-batchit-card shrink-0" />
      <div className="h-8 bg-batchit-card rounded-2xl rounded-bl-sm w-36" />
    </div>
  </div>
);

export const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 p-3.5 border-b border-batchit-border/40 animate-pulse">
    <div className="w-12 h-12 rounded-full bg-batchit-card shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-batchit-card rounded w-1/3" />
      <div className="h-3 bg-batchit-card rounded w-2/3" />
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-batchit-card border border-batchit-border rounded-2xl p-4 animate-pulse space-y-3">
    <div className="w-full h-36 bg-batchit-secondary rounded-xl" />
    <div className="h-4 bg-batchit-secondary rounded w-1/2" />
    <div className="h-3 bg-batchit-secondary rounded w-3/4" />
  </div>
);
