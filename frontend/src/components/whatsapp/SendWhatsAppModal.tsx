import React, { useEffect, useState } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Users,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Tag,
  Info,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { WhatsAppTemplate, WhatsAppCustomerRecipient, SendBulkWhatsAppResponse } from '../../types';
import api from '../../api/client';

interface SendWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: WhatsAppCustomerRecipient[];
  onSuccess?: () => void;
}

export const SendWhatsAppModal: React.FC<SendWhatsAppModalProps> = ({
  isOpen,
  onClose,
  recipients,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Editable Form Inputs
  const [campaignName, setCampaignName] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [category, setCategory] = useState<string>('Offers');
  const [messagePreview, setMessagePreview] = useState<string>('');
  const [mediaUrl, setMediaUrl] = useState<string>('');

  const [isSending, setIsSending] = useState<boolean>(false);
  const [showRecipientsList, setShowRecipientsList] = useState<boolean>(false);

  // Fetch templates when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const res = await api.get<WhatsAppTemplate[]>('/api/v1/whatsapp/templates');
      setTemplates(res.data);

      // Auto-select first template if available
      if (res.data.length > 0) {
        const first = res.data[0];
        setSelectedTemplateId(first.id.toString());
        setCampaignName(first.campaign_name);
        setTemplateId(first.template_id);
        setCategory(first.category || 'Offers');
        setMessagePreview(first.description || '');
        setMediaUrl(first.media_url || '');
      }
    } catch (err) {
      console.error('Failed to load WhatsApp templates:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleTemplateChange = (idStr: string) => {
    setSelectedTemplateId(idStr);
    if (idStr === 'custom') {
      setCampaignName('');
      setTemplateId('');
      setMessagePreview('Custom campaign or custom template message');
      setMediaUrl('');
      return;
    }

    const tpl = templates.find((t) => t.id.toString() === idStr);
    if (tpl) {
      setCampaignName(tpl.campaign_name);
      setTemplateId(tpl.template_id);
      setCategory(tpl.category || 'Offers');
      setMessagePreview(tpl.description || '');
      setMediaUrl(tpl.media_url || '');
    }
  };

  // Filter valid recipients with phone numbers
  const validRecipients = recipients.filter((r) => r.phone && r.phone.trim().length >= 10);
  const invalidRecipients = recipients.filter((r) => !r.phone || r.phone.trim().length < 10);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validRecipients.length === 0) {
      toastError('No valid customer recipients with 10-digit phone numbers selected.');
      return;
    }

    if (!campaignName.trim()) {
      toastError('Please enter or select a valid Campaign Name / ID.');
      return;
    }

    try {
      setIsSending(true);
      const payload = {
        customers: validRecipients.map((r) => ({
          name: r.name || 'Customer',
          phone: r.phone.trim(),
        })),
        campaign_name: campaignName.trim(),
        template_id: templateId.trim() || campaignName.trim(),
        template_name: templates.find((t) => t.id.toString() === selectedTemplateId)?.name || campaignName.trim(),
        category,
        media_url: mediaUrl.trim() || undefined,
      };

      const res = await api.post<SendBulkWhatsAppResponse>('/api/v1/whatsapp/send-bulk', payload);

      if (res.data.success) {
        success(res.data.message || `Dispatched WhatsApp messages to ${validRecipients.length} customer(s).`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toastError(res.data.message || 'Failed to dispatch WhatsApp messages.');
      }
    } catch (err: any) {
      console.error('WhatsApp send error:', err);
      const detail = err?.response?.data?.detail || 'Failed to dispatch WhatsApp message.';
      toastError(detail);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border border-[#E4DFD4] overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-linear-to-r from-[#18181B] to-[#27272A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#16A34A]/20 border border-[#16A34A]/40 flex items-center justify-center text-[#4ADE80]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Send WhatsApp Campaign</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16A34A] text-white font-bold uppercase tracking-wider">
                  AiSensy
                </span>
              </h3>
              <p className="text-[11px] text-[#A1A1AA]">
                Dispatches approved template messages directly to customer WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="p-1.5 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSend} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Recipients Summary Card */}
          <div className="bg-[#FAF8F5] border border-[#E6E1D6] rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#16A34A]" />
                <span className="text-xs font-bold text-[#1D1D1B]">
                  Selected Recipients:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#166534] font-extrabold text-xs">
                  {validRecipients.length} Ready
                </span>
                {invalidRecipients.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#991B1B] font-bold text-[10px]">
                    {invalidRecipients.length} Missing Phone
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowRecipientsList(!showRecipientsList)}
                className="text-xs font-bold text-[#536B8A] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showRecipientsList ? 'Hide' : 'View'} List</span>
                {showRecipientsList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Collapsible Recipients List */}
            {showRecipientsList && (
              <div className="max-h-36 overflow-y-auto divide-y divide-[#E6E1D6] bg-white rounded-xl border border-[#E6E1D6] p-2 mt-2">
                {recipients.map((r, i) => {
                  const hasValid = r.phone && r.phone.trim().length >= 10;
                  return (
                    <div key={i} className="py-1 px-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1D1D1B] truncate max-w-[180px]">
                        {r.name || 'Customer'}
                      </span>
                      <span className={`font-mono text-[11px] ${hasValid ? 'text-[#166534]' : 'text-[#DC2626]'}`}>
                        {r.phone || 'No phone'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 1. Template Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1D1D1B] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Select WhatsApp Template *</span>
              </label>
              {isLoadingTemplates && (
                <span className="text-[10px] text-[#8A8479] animate-pulse">Loading templates...</span>
              )}
            </div>

            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#C5D5E6] bg-white text-xs font-semibold text-[#1D1D1B] focus:ring-2 focus:ring-[#16A34A] focus:border-[#16A34A] outline-hidden cursor-pointer"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id.toString()}>
                  {tpl.name} ({tpl.category}) — [{tpl.campaign_name}]
                </option>
              ))}
              <option value="custom">-- Custom Template / Direct Entry --</option>
            </select>
          </div>

          {/* 2. Campaign ID & Template ID Inputs (Directly editable as requested!) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#525252] flex items-center gap-1">
                <span>Campaign Name / ID *</span>
                <span className="text-[10px] text-[#8A8479] font-normal">(AiSensy)</span>
              </label>
              <input
                type="text"
                required
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. diwali_festival_special"
                className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] bg-[#FAF8F5] text-xs font-mono font-semibold text-[#1D1D1B] focus:bg-white focus:ring-2 focus:ring-[#16A34A] outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#525252] flex items-center gap-1">
                <span>Template ID *</span>
                <span className="text-[10px] text-[#8A8479] font-normal">(Meta)</span>
              </label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="e.g. festival_offer_v1"
                className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] bg-[#FAF8F5] text-xs font-mono font-semibold text-[#1D1D1B] focus:bg-white focus:ring-2 focus:ring-[#16A34A] outline-hidden"
              />
            </div>
          </div>

          {/* 3. Category & Optional Media Banner URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#525252] flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#536B8A]" />
                <span>Campaign Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] bg-white text-xs font-medium text-[#1D1D1B] focus:ring-2 focus:ring-[#16A34A] outline-hidden cursor-pointer"
              >
                <option value="Offers">Offers & Discounts</option>
                <option value="Festival & Offers">Festival Special</option>
                <option value="Exchange">Gold Exchange Privilege</option>
                <option value="Sold">Purchase Thank You</option>
                <option value="Follow-up">In Hold / Follow-up</option>
                <option value="General">General Outreach</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#525252] flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-[#536B8A]" />
                <span>Media / Image URL (Optional)</span>
              </label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/festive-banner.jpg"
                className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] bg-[#FAF8F5] text-xs font-mono text-[#1D1D1B] focus:bg-white focus:ring-2 focus:ring-[#16A34A] outline-hidden"
              />
            </div>
          </div>

          {/* 4. Message Content Preview (What message will be sent) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#525252] flex items-center gap-1">
              <Info className="w-3 h-3 text-[#16A34A]" />
              <span>Sample Message Text / Campaign Description:</span>
            </label>
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-3 text-xs text-[#166534] font-medium leading-relaxed relative">
              <p className="whitespace-pre-wrap">{messagePreview || 'No description preview available for this campaign.'}</p>
              <div className="text-[9px] text-[#15803D] font-bold mt-2 text-right">
                Delivered via Siri Samruddhi Verified WhatsApp Business Account
              </div>
            </div>
          </div>
        </form>

        {/* Action Footer */}
        <div className="px-5 sm:px-6 py-4 bg-[#FAF8F5] border-t border-[#E6E1D6] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#6B6559] hover:bg-[#EAE5D9] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || validRecipients.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-linear-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#166534] shadow-md shadow-[#16A34A]/25 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending WhatsApp Messages...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp ({validRecipients.length} Recipients)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
