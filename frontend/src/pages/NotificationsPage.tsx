import { useState, useEffect, useRef } from 'react';
import { FiBell, FiAlertTriangle, FiFileText, FiInfo } from 'react-icons/fi';
import api from '../api';

interface Notification { id: number; type: string; title: string; message: string; is_read: boolean; created_at: string; related_zone_id: number | null; related_alert_id: number | null; }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef<any>(null);

  const fetchNotifications = async () => {
    try {
      const [notiRes, countRes] = await Promise.all([api.get('/notifications'), api.get('/notifications/unread-count')]);
      setNotifications(notiRes.data);
      setUnreadCount(countRes.data.count);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); pollRef.current = setInterval(fetchNotifications, 10000); return () => clearInterval(pollRef.current); }, []);

  const markRead = async (id: number) => {
    try { await api.patch(`/notifications/${id}/read`); setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n)); setUnreadCount(prev => Math.max(0, prev - 1)); }
    catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try { await api.patch('/notifications/read-all'); setNotifications(prev => prev.map(n => ({ ...n, is_read: true }))); setUnreadCount(0); }
    catch (e) { console.error(e); }
  };

  const typeIcon = (t: string) => t === 'alert' ? <FiAlertTriangle size={16}/> : t === 'report' ? <FiFileText size={16}/> : <FiInfo size={16}/>;
  const typeColor = (t: string) => t === 'alert' ? 'bg-risk-high text-risk-high' : t === 'report' ? 'bg-risk-medium text-risk-medium' : 'bg-teal/10 text-teal';

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-text">Notifications</h2>
          <p className="text-sm text-text-mute mt-1">Real-time updates on risk alerts and reports</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-ghost border border-border py-2 px-4 text-xs flex items-center justify-center gap-1.5 sm:ml-auto">
            <FiBell size={14}/> Mark all read ({unreadCount} unread)
          </button>
        )}
      </div>
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-text-mute text-sm">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 md:p-12 text-center">
          <FiBell size={48} className="mx-auto text-text-mute mb-4" />
          <p className="text-text font-medium">No Notifications</p>
          <p className="text-sm text-text-mute mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} onClick={() => !n.is_read && markRead(n.id)} className={`bg-card border rounded-xl p-3 md:p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${n.is_read ? 'border-border opacity-70 hover:opacity-100' : 'border-teal/20 bg-teal/5'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeColor(n.type)}`}>
                  {typeIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`font-medium text-sm truncate ${n.is_read ? 'text-text-mute' : 'text-text'}`}>{n.title}</h3>
                    {!n.is_read && <span className="w-2 h-2 bg-teal rounded-full flex-shrink-0"/>}
                  </div>
                  <p className="text-xs text-text-mute line-clamp-2">{n.message}</p>
                  <span className="text-[10px] text-text-mute mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
