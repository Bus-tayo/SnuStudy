'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeNotificationEvents,
} from '@/lib/repositories/notificationsRepo';
import { getAppUserIdFromStorage } from '@/lib/utils/appUser';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Bell, CheckCheck, Inbox, Loader2, X } from 'lucide-react';

const TYPE_LABEL = {
  TASK_TODAY: '오늘의 할 일',
  TASK_REMINDER: '미완료 리마인드',
  FEEDBACK_NEW: '피드백',
};

const TYPE_BADGE = {
  TASK_TODAY: 'bg-blue-100 text-blue-700 border-blue-200',
  TASK_REMINDER: 'bg-amber-100 text-amber-800 border-amber-200',
  FEEDBACK_NEW: 'bg-green-100 text-green-700 border-green-200',
};

function fromNow(isoString) {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true, locale: ko });
  } catch {
    return '';
  }
}

export default function NotificationCenter() {
  const [userId, setUserId] = useState(null);
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const uid = getAppUserIdFromStorage();
    if (uid) setUserId(uid);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let alive = true;

    async function bootstrap() {
      try {
        setLoading(true);
        const [initial, unreadCount] = await Promise.all([
          fetchNotifications({ userId }),
          fetchUnreadCount(userId),
        ]);
        if (!alive) return;
        setList(initial);
        setUnread(unreadCount);
      } catch (e) {
        console.error('[NotificationCenter] 초기화 실패', e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    bootstrap();

    const unsubscribe = subscribeNotificationEvents(userId, {
      onInsert: (row) => {
        setList((prev) => [row, ...prev].slice(0, 50));
        setUnread((prev) => prev + (row?.is_read ? 0 : 1));
      },
      onUpdate: (row) => {
        setList((prev) => prev.map((n) => (n.id === row.id ? row : n)));
        if (row.is_read) {
          setUnread((prev) => Math.max(0, prev - 1));
        }
      },
      onDelete: (row) => {
        setList((prev) => prev.filter((n) => n.id !== row.id));
      },
    });

    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [userId]);

  const hasUnread = unread > 0;

  async function handleClickItem(item) {
    if (!item || item.is_read) return;
    try {
      await markNotificationRead(item.id, userId);
      setList((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('[NotificationCenter] 읽음 처리 실패', e);
    }
  }

  async function handleMarkAll() {
    if (!userId || unread === 0) return;
    try {
      await markAllNotificationsRead(userId);
      setList((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch (e) {
      console.error('[NotificationCenter] 모두 읽음 실패', e);
    }
  }

  const panel = useMemo(() => {
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-end sm:justify-center px-3 sm:px-4 py-4 bg-black/20 backdrop-blur-sm">
        <div className="w-full max-w-[430px] shadow-2xl rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-b from-white to-slate-50">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white/70 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-slate-900">알림함</span>
                <span className="text-[11px] text-slate-500">실시간으로 새 소식을 받아보세요</span>
              </div>
              {hasUnread ? (
                <span className="ml-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {unread} 새 알림
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                모두 읽음
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="알림 닫기"
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="py-10 flex flex-col items-center justify-center text-sm text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                불러오는 중...
              </div>
            ) : list.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-sm text-slate-500 gap-2">
                <Inbox className="w-6 h-6" />
                아직 알림이 없습니다.
              </div>
            ) : (
              list.map((n) => {
                const badgeCls = TYPE_BADGE[n.type] ?? 'bg-slate-100 text-slate-600 border-slate-200';
                const label = TYPE_LABEL[n.type] ?? n.type;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClickItem(n)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      n.is_read ? 'bg-white' : 'bg-primary/5'
                    } hover:bg-primary/10`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${badgeCls}`}>
                          {label}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                        <div className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">
                          {n.body}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-2">
                          {fromNow(n.created_at)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }, [open, list, unread, loading, hasUnread]);

  if (!userId) return null;

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative rounded-full bg-white shadow-md border border-slate-200 p-2 hover:shadow-lg transition-shadow"
          aria-label="알림 보기"
        >
          <Bell className="w-6 h-6 text-slate-800" />
          {hasUnread ? (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] text-white font-bold flex items-center justify-center px-1">
              {unread}
            </span>
          ) : null}
        </button>
      </div>
      {panel}
    </>
  );
}
