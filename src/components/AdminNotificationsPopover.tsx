import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Check,
  Clock,
  ExternalLink,
  Volume2,
  VolumeX,
  Trash2,
  X,
  Inbox,
  User,
  Phone,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export interface AdminNotification {
  id: string;
  title: string;
  subtitle: string;
  message: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  service: string;
  urgency?: string;
  leadId?: string;
  timestamp: string;
  createdAt: number;
  isRead: boolean;
  type: 'email_form' | 'lead_signal' | 'urgent_inbound';
}

interface AdminNotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectLead: (leadId: string) => void;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  isDarkMode?: boolean;
}

export function AdminNotificationsPopover({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectLead,
  isAudioEnabled,
  onToggleAudio,
  isDarkMode = false
}: AdminNotificationsPopoverProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'email'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'email') return n.type === 'email_form';
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-900/30 backdrop-blur-2xs"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md sm:max-w-lg mt-14 rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[85vh] transition-all animate-fade-in ${
          isDarkMode
            ? 'bg-[#151926] border-[#252B3E] text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Admin Inbound Notifications"
      >
        {/* Top Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isDarkMode ? 'bg-[#1C2234] border-[#252B3E]' : 'bg-[#FFF0F5] border-[#F0C6D6]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#C2185B] text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-bold font-serif ${isDarkMode ? 'text-white' : 'text-[#2D2D2D]'}`}>
                  Inbound Notifications &amp; Alerts
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-[#C2185B] text-white font-mono font-bold px-1.5 py-0.2 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-[#6E5A64]'}`}>
                Live signals and website pop-up form submissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Chime Mute/Unmute */}
            <button
              type="button"
              onClick={onToggleAudio}
              title={isAudioEnabled ? 'Audio chime enabled for incoming leads' : 'Audio chime muted'}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isAudioEnabled
                  ? isDarkMode
                    ? 'border-emerald-800 bg-emerald-950/40 text-emerald-400'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : isDarkMode
                  ? 'border-slate-700 bg-slate-800 text-slate-400'
                  : 'border-slate-200 bg-slate-100 text-slate-500'
              }`}
            >
              {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-pink-100/50'
              }`}
              title="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills & Actions Bar */}
        <div
          className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 text-xs ${
            isDarkMode ? 'bg-[#181C2C] border-[#252B3E]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'email', label: 'Email Forms' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  filter === tab.id
                    ? isDarkMode
                      ? 'bg-[#C2185B] text-white font-semibold'
                      : 'bg-white shadow-2xs border border-slate-300 text-slate-900 font-semibold'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-[11px] text-[#C2185B] dark:text-pink-400 hover:underline cursor-pointer font-medium"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[11px] text-slate-400 hover:text-red-500 cursor-pointer inline-flex items-center gap-0.5"
                title="Clear all notifications"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div
                className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                  isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-slate-500">No notifications in this filter</p>
              <p className="text-[11px] text-slate-400">
                New form submissions and candidate signals will appear here in real-time.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.isRead
                    ? isDarkMode
                      ? 'bg-[#151926]/40 border-transparent text-slate-400'
                      : 'bg-white border-transparent text-slate-600'
                    : isDarkMode
                    ? 'bg-[#1C2234] border-[#2A324B] text-slate-100 shadow-xs'
                    : 'bg-[#FFF9FB] border-[#F0C6D6] text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        item.isRead ? 'bg-slate-300 dark:bg-slate-700' : 'bg-[#C2185B] animate-pulse'
                      }`}
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs">{item.senderName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-pink-100 dark:bg-pink-950/70 text-[#C2185B] dark:text-pink-300 font-medium">
                        {item.service}
                      </span>
                      {item.urgency && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium">
                          {item.urgency === 'urgent_48h' ? '⚡ 24-48h' : 'Standard'}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                    {item.timestamp}
                  </span>
                </div>

                {/* Sender contact details */}
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#C2185B]" />
                    <a href={`mailto:${item.senderEmail}`} className="hover:underline">
                      {item.senderEmail}
                    </a>
                  </span>
                  {item.senderPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{item.senderPhone}</span>
                    </span>
                  )}
                </div>

                {/* Message Body */}
                <p className="mt-2 text-xs leading-relaxed line-clamp-3 italic opacity-90 pl-2 border-l-2 border-[#C2185B]/40">
                  "{item.message}"
                </p>

                {/* Action Buttons */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {item.leadId && (
                      <button
                        type="button"
                        onClick={() => {
                          onMarkAsRead(item.id);
                          onSelectLead(item.leadId!);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#C2185B] hover:bg-[#9C1450] text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Open &amp; Qualify Lead</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    <a
                      href={`mailto:${item.senderEmail}?subject=${encodeURIComponent(
                        `Purpose & Glow Response: ${item.service} for ${item.senderName}`
                      )}`}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors inline-flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Reply</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => onMarkAsRead(item.id)}
                    className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {item.isRead ? 'Mark unread' : 'Mark read'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-4 py-2 border-t text-[11px] flex items-center justify-between ${
            isDarkMode ? 'bg-[#121624] border-[#252B3E] text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#C2185B]" />
            Purpose &amp; Glow Real-Time Inbound Desk
          </span>
          <span className="font-mono text-[10px]">Recipient: ngotsch@outlook.com</span>
        </div>
      </div>
    </div>
  );
}
