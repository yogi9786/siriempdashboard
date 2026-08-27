import React, { ReactNode } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-[#E8E6E1] rounded-2xl my-4 shadow-2xs">
      <div className="w-12 h-12 rounded-2xl bg-[#FAF6EB] border border-[#EEDFA8] text-[#8B6D1B] flex items-center justify-center mb-3.5 shadow-2xs">
        <Icon className="w-5 h-5 text-[#C9A227]" />
      </div>
      <h4 className="text-sm sm:text-base font-bold text-[#171717] mb-1">{title}</h4>
      <p className="text-xs text-[#737373] max-w-sm mb-5 leading-relaxed font-medium">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} leftIcon={actionIcon}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
