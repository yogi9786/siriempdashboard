import React, { useState } from 'react';
import {
  Calendar,
  Phone,
  User,
  Heart,
  Gift,
  IndianRupee,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  Award,
  Star,
  MessageSquareHeart,
  Video,
  Eye,
  ArrowUpDown,
  FileImage,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CustomerActivity, CustomerDetailItem } from '../../types';
import { parseCustomerBreakdown } from '../../utils/customerUtils';
import { getMediaUrl } from '../../utils/media';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.53 1.83.812 2.796.813 3.179 0 5.767-2.587 5.768-5.766.001-3.181-2.587-5.766-5.768-5.766zm3.376 8.212c-.144.405-.837.774-1.17.824-.312.045-.717.067-1.168-.08-.288-.094-.658-.236-1.144-.45-2.072-.913-3.414-3.033-3.518-3.173-.104-.14-1.01-1.344-1.01-2.564 0-1.22.637-1.82.863-2.066.226-.246.495-.308.66-.308.165 0 .33.003.475.01.153.008.358-.058.56.427.207.497.708 1.724.77 1.849.062.125.104.271.021.437-.083.165-.124.27-.247.416-.124.145-.262.325-.374.436-.125.124-.255.26-.11.51.145.249.645 1.062 1.385 1.722.953.849 1.756 1.112 2.004 1.237.248.125.394.104.539-.063.145-.166.621-.726.786-.975.166-.249.331-.208.558-.125.228.083 1.446.682 1.694.807.248.124.414.186.475.29.063.104.063.602-.081 1.007zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
  </svg>
);

interface CustomerActivityViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: CustomerActivity | null;
  onApprove?: (activity: CustomerActivity) => void;
  onReject?: (activity: CustomerActivity) => void;
}

export const CustomerActivityViewModal: React.FC<CustomerActivityViewModalProps> = ({
  isOpen,
  onClose,
  activity,
  onApprove,
  onReject,
}) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!isOpen || !activity) return null;

  const items: CustomerDetailItem[] = parseCustomerBreakdown(
    activity.breakdown,
    activity.customers_count || 1,
    activity.status,
    activity.customer_name,
    activity.phone_number,
    activity.dob,
    activity.anniversary,
    activity.product_value
  );

  const isPending = activity.approval_status === 'PENDING';
  const isApproved = activity.approval_status === 'APPROVED';
  const isRejected = activity.approval_status === 'REJECTED';

  const formatOutcome = (st?: string) => {
    if (!st || st === 'Walkin' || st === 'Walk-in') return 'Window Shopping';
    return st;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E4DFD4] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBE6DC] bg-[#FAF8F3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7E22CE]/10 border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1D1D1B]">
                Customer Activity Details #{activity.id}
              </h3>
              <p className="text-xs text-[#6B6559] flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#7E22CE]" />
                <span>Visit Date: {activity.activity_date}</span>
                {activity.branch_name && (
                  <span className="text-[#8A8479]">• {activity.branch_name}</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white hover:bg-[#F2EDE4] text-[#6B6559] hover:text-[#1D1D1B] border border-[#E4DFD4] flex items-center justify-center font-bold text-sm cursor-pointer transition-colors shadow-2xs"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Staff attribution & Manager Approval banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="text-[10px] uppercase font-bold text-[#8A8479] tracking-wider block">
                Submitted By Staff Member
              </span>
              <div className="flex items-center justify-between mt-1">
                <div className="font-extrabold text-[#1D1D1B] text-sm">
                  {activity.employee_name || 'Staff Member'}
                </div>
                {activity.employee_code && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-white text-[#536B8A] font-bold border border-[#CBD5E1]">
                    {activity.employee_code}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="text-[10px] uppercase font-bold text-[#8A8479] tracking-wider block">
                Verification Status
              </span>
              <div className="mt-1 flex items-center justify-between">
                {isPending && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEFCE8] border border-[#FEF08A] text-[#854D0E] text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-[#EAB308]" />
                    <span>Pending Manager Verification</span>
                  </span>
                )}
                {isApproved && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Approved{activity.reviewed_by_name ? ` by ${activity.reviewed_by_name}` : ''}</span>
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-bold">
                    <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                    <span>Rejected{activity.reviewed_by_name ? ` by ${activity.reviewed_by_name}` : ''}</span>
                  </span>
                )}
              </div>
              {activity.rejection_reason && (
                <p className="text-[10px] text-[#DC2626] font-medium mt-1">
                  Reason: {activity.rejection_reason}
                </p>
              )}
            </div>
          </div>

          {/* Customer Records List */}
          <div className="space-y-4">
            {items.map((cust, idx) => {
              const outcome = formatOutcome(cust.status);

              return (
                <div
                  key={idx}
                  className="bg-white border border-[#E6E1D6] rounded-2xl p-4 shadow-xs space-y-3 relative"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE1]">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#7E22CE] text-white text-xs font-extrabold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-extrabold text-[#1D1D1B] text-sm">
                        {cust.name || (items.length === 1 ? activity.customer_name : `Customer #${idx + 1}`)}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          outcome === 'Sold'
                            ? 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]'
                            : outcome === 'Exchange'
                              ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                              : outcome === 'Window Shopping'
                                ? 'bg-[#F4F1EA] text-[#5E5A52] border-[#E4DFD4]'
                                : outcome === 'Interested' || outcome === 'In Hold / Follow Up'
                                  ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                                  : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
                        }`}
                      >
                        {outcome}
                      </span>
                      {outcome === 'Exchange' && cust.exchange_type && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]">
                          {cust.exchange_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Information Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#EFEBE1]">
                      <span className="text-[10px] uppercase font-bold text-[#8A8479] block">Mobile</span>
                      <div className="font-mono font-bold text-[#1D1D1B] mt-0.5 flex items-center gap-1">
                        <span>{cust.phone || 'N/A'}</span>
                        {cust.phone && (
                          <a
                            href={`https://wa.me/${cust.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#25D366] hover:opacity-80"
                            title="Chat on WhatsApp"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#EFEBE1]">
                      <span className="text-[10px] uppercase font-bold text-[#8A8479] block">Value (₹)</span>
                      <div className="font-mono font-bold text-[#21845F] mt-0.5">
                        {cust.product_value
                          ? `₹${Number(cust.product_value).toLocaleString('en-IN')}`
                          : '₹0'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#EFEBE1]">
                      <span className="text-[10px] uppercase font-bold text-[#8A8479] block">Product Code</span>
                      <div className="font-mono font-bold text-[#536B8A] mt-0.5 uppercase truncate">
                        {cust.product_id || '—'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#EFEBE1]">
                      <span className="text-[10px] uppercase font-bold text-[#8A8479] block">Special Dates</span>
                      <div className="font-medium text-[#1D1D1B] mt-0.5 space-y-0.5 text-[10.5px]">
                        {cust.dob && <div>DOB: {cust.dob}</div>}
                        {cust.anniversary && <div>Anniv: {cust.anniversary}</div>}
                        {!cust.dob && !cust.anniversary && <span className="text-[#8A8479]">—</span>}
                      </div>
                    </div>
                  </div>

                  {/* Sold Item Photo Proof Card */}
                  {cust.sold_image_url && (
                    <div className="p-3 rounded-xl bg-[#E8F4EE] border border-[#A7F3D0]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#166534] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#21845F]" />
                          Sold Item Ornament / Invoice Photo
                        </span>
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Closed Deal
                        </span>
                      </div>
                      <div className="w-full max-w-xs rounded-xl overflow-hidden border border-[#86EFAC] bg-white p-1">
                        <img
                          src={getMediaUrl(cust.sold_image_url)}
                          alt="Sold Ornament"
                          onClick={() => setLightboxUrl(getMediaUrl(cust.sold_image_url))}
                          className="w-full max-h-48 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          title="Click to view full image"
                        />
                      </div>
                    </div>
                  )}

                  {/* Video Review Card with 16:9 Aspect Ratio */}
                  {cust.has_video_review && (
                    <div className="p-3.5 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#7E22CE] flex items-center gap-1.5">
                          <Video className="w-4 h-4 text-[#A855F7]" />
                          Customer Video Review ({cust.videos_count || 1} Video{(cust.videos_count || 1) > 1 ? 's' : ''})
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          +{(cust.videos_count || 1) * 5} Points on Approval
                        </span>
                      </div>
                      {cust.video_title && (
                        <p className="text-xs font-semibold text-[#1D1D1B]">
                          "{cust.video_title}"
                        </p>
                      )}
                      {cust.video_url && (
                        <div>
                          <a
                            href={cust.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#7E22CE] font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open Video URL Link</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                      {cust.video_screenshot && (
                        <div className="pt-2 border-t border-purple-200">
                          <span className="text-[10px] uppercase font-bold text-purple-700 block mb-1.5">
                            Video Proof Thumbnail (16:9 Aspect Ratio):
                          </span>
                          <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden border border-purple-300 bg-black shadow-sm flex items-center justify-center">
                            <img
                              src={getMediaUrl(cust.video_screenshot)}
                              alt="Video Proof Thumbnail"
                              onClick={() => setLightboxUrl(getMediaUrl(cust.video_screenshot))}
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              title="Click to zoom image"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Gold Scheme Enrollment Card with Notes and Reminder */}
                  {cust.has_scheme && cust.scheme_name && (
                    <div className="p-3.5 rounded-xl bg-[#FDF6E2] border border-[#DFCFA6]">
                      <span className="text-xs font-bold text-[#9A782F] flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#D97706]" />
                        Gold Scheme Enrollment
                      </span>
                      <div className="text-xs text-[#1D1D1B] mt-2 space-y-1">
                        <div>Plan: <strong>{cust.scheme_name}</strong></div>
                        {cust.scheme_amount && <div>Monthly Installment: <strong>₹{cust.scheme_amount}</strong></div>}
                        {cust.scheme_notes && <div>Price Notes: <strong>{cust.scheme_notes}</strong></div>}
                        {cust.scheme_reminder_date && (
                          <div className="flex items-center gap-1 text-[#7E22CE] font-bold pt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>First Reminder Due: {cust.scheme_reminder_date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Google Review Card */}
                  {cust.has_google_review && (
                    <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1D4ED8] flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-[#2563EB]" />
                          Google Review ({cust.google_review_rating || 5} Stars)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          +1 Point on Approval
                        </span>
                      </div>
                      {cust.google_review_text && (
                        <p className="text-xs text-[#1D1D1B] mt-1.5 italic">
                          "{cust.google_review_text}"
                        </p>
                      )}
                      {cust.google_review_screenshot && (
                        <div className="mt-2.5 pt-2 border-t border-blue-200">
                          <span className="text-[10px] uppercase font-bold text-blue-700 block mb-1.5">
                            Google Review Photo Proof:
                          </span>
                          <div className="w-full max-w-sm rounded-xl overflow-hidden border border-blue-200 bg-white p-1">
                            <img
                              src={getMediaUrl(cust.google_review_screenshot)}
                              alt="Review Proof"
                              onClick={() => setLightboxUrl(getMediaUrl(cust.google_review_screenshot))}
                              className="w-full max-h-48 object-contain rounded-lg cursor-pointer hover:opacity-90"
                              title="Click to view full image"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer Feedback */}
                  {cust.has_customer_feedback && (
                    <div className="p-3 rounded-xl bg-[#F5EDF1] border border-[#E5CFDB]">
                      <span className="text-xs font-bold text-[#6B4657] flex items-center gap-1.5">
                        <MessageSquareHeart className="w-3.5 h-3.5 text-[#BE185D]" />
                        Direct Customer Feedback ({cust.feedback_rating || 5}★)
                      </span>
                      {cust.feedback_text && (
                        <p className="text-xs text-[#1D1D1B] mt-1 italic">
                          "{cust.feedback_text}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Individual Customer Notes */}
                  {cust.notes && (
                    <div className="text-xs text-[#525252] bg-[#FAF8F3] p-2.5 rounded-xl border border-[#EFEBE1]">
                      <span className="font-bold text-[#5E5A52] block text-[10.5px] uppercase mb-0.5">
                        Customer Inquiries / Notes:
                      </span>
                      <p className="whitespace-pre-wrap">{cust.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall Activity Notes */}
          {activity.notes && (
            <div className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="text-[10px] uppercase font-bold text-[#8A8479] tracking-wider block">
                Overall Activity Notes
              </span>
              <p className="text-xs text-[#1D1D1B] mt-1 whitespace-pre-wrap font-medium">
                {activity.notes}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#EBE6DC] bg-[#FAF8F3] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="bg-white hover:bg-[#F2EDE4] text-[#1D1D1B] border-[#D5CFC4] text-xs font-bold px-5 py-2 rounded-xl shadow-2xs"
          >
            Close
          </Button>

          {activity.approval_status === 'PENDING' && (onApprove || onReject) && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {onReject && (
                <button
                  type="button"
                  onClick={() => onReject(activity)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white border border-[#FECACA] hover:bg-[#FEF2F2] text-[#DC2626] text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                >
                  <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Reject Entry</span>
                </button>
              )}
              {onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(activity)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#23815F] hover:bg-[#1B694C] text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Approve Customer Entry</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Preview Modal for Zooming Photos */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="text-sm font-bold flex items-center gap-2">
                <FileImage className="w-4 h-4 text-amber-400" />
                Image Proof Preview
              </span>
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-2xl">
              <img
                src={lightboxUrl}
                alt="Enlarged Proof"
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
