import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string; fullPage?: boolean }> = ({
  message = 'Loading data...',
  fullPage = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#EEDFA8] border-t-[#C9A227] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-[#C9A227] animate-pulse" />
        </div>
      </div>
      <p className="text-xs font-semibold text-[#737373] tracking-wide uppercase">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
