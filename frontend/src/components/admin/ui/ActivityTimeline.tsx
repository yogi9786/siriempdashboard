import React from 'react';
import { UserCheck, Award, Star, Shirt, FileText, Compass, ShieldAlert } from 'lucide-react';
import { AdminActivityFeedItem } from '../../../types';

interface ActivityTimelineProps {
  items: AdminActivityFeedItem[];
  emptyMessage?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  items,
  emptyMessage = 'No recent activity recorded for this period.',
}) => {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-[#8A8479] font-medium bg-[#FAF8F3] rounded-2xl border border-[#E4DFD4]">
        {emptyMessage}
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return <UserCheck className="w-3.5 h-3.5 text-[#7E22CE]" />;
      case 'scheme':
        return <Award className="w-3.5 h-3.5 text-[#21845F]" />;
      case 'review':
        return <Star className="w-3.5 h-3.5 fill-[#B97855] text-[#B97855]" />;
      case 'attire':
        return <Shirt className="w-3.5 h-3.5 text-[#526F91]" />;
      case 'form':
        return <FileText className="w-3.5 h-3.5 text-[#B97855]" />;
      case 'outdoor':
        return <Compass className="w-3.5 h-3.5 text-[#21845F]" />;
      default:
        return <ShieldAlert className="w-3.5 h-3.5 text-[#7E22CE]" />;
    }
  };

  const getDotColor = (type: string) => {
    switch (type) {
      case 'customer':
        return 'bg-[#7E22CE]';
      case 'scheme':
        return 'bg-[#21845F]';
      case 'review':
        return 'bg-[#B97855]';
      case 'attire':
        return 'bg-[#526F91]';
      default:
        return 'bg-[#7E22CE]';
    }
  };

  return (
    <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EBE6DC]">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 relative pl-6 group">
          <div
            className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-2xs ${getDotColor(
              item.event_type
            )} group-hover:scale-125 transition-transform`}
          />
          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-[#1D1D1B] truncate">{item.title}</p>
              {item.status_tag && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E4DFD4] text-[#7E22CE] shrink-0">
                  {item.status_tag}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#5E5A52] line-clamp-1">{item.description}</p>
            <div className="flex items-center gap-2 text-[10px] text-[#8A8479] font-medium pt-0.5">
              {item.branch_name && (
                <span className="font-bold text-[#7E22CE]">{item.branch_name}</span>
              )}
              {item.branch_name && <span>•</span>}
              <span>{item.timestamp}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
