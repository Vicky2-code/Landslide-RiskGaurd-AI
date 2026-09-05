import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiAlertTriangle, FiFileText, FiMessageCircle, FiCheckCircle } from 'react-icons/fi';
import api, { Notification } from '../api';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  risk_alert: { icon: <FiAlertTriangle size={16} />, color: '#dc2626', bg: '#fee2e2' },
  new_report: { icon: <FiFileText size={16} />, color: '#d97706', bg: '#fef9c3' },
  report_update: { icon: <FiCheckCircle size={16} />, color: '#16a34a', bg: '#dcfce7' },
  sms_sent: { icon: <FiMessageCircle size={16} />, color: '#0d9488', bg: '#ccfbf1' },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const pollRef = useRef<any>(null);

  const fetchNotifs = async () => {
    try {
      const params: any = {};
      if (filter === 'unread') params.status = 'unread';
      const res = await api.get('/notifications', { params });
      setNotifs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifs(); }, [filter]);

  useEffect(() => {
    pollRef.current = setInterval(fetchNotifs, 10000);
    return () => clearInterval(pollRef.current);
  }, [filter]);

  const markRead = async (id: number) => {
    await api.patch(`/notifications/${id}/read`);
    fetchNotifs();
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    fetchNotifs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold text-text">Notifications</h2>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === f ? 'bg-teal text-white' : 'bg-card border border-border text-text-mute hover:text-text'
                }`}
              >
                {f === 'all' ? 'All' : 'Unread'}
              </button>
            ))}
          </div>
          <button onClick={markAllRead} className="btn-secondary text-xs py-2 px-4">
            Mark all read
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-mute">Loading notifications...</div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-20">
          <FiBell className="mx-auto text-text-soft mb-3" size={40} />
          <p className="text-text-mute">No notifications{filter === 'unread' ? ' — all caught up!' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const config = TYPE_CONFIG[n.notification_type] || TYPE_CONFIG.risk_alert;
            return (
              <div
                key={n.id}
                className={`bg-card border border-border rounded-xl p-4 flex items-start gap-4 transition-colors ${
                  !n.is_read ? 'bg-teal/3 border-l-4 border-l-teal' : ''
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: config.bg, color: config.color }}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-text">{n.title}</span>
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-teal rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-mute leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {n.zone_name && (
                      <button
                        onClick={() => navigate(`/zones/${n.zone_id}`)}
                        className="text-xs text-teal hover:underline"
                      >
                        View Zone →
                      </button>
                    )}
                    <span className="text-xs text-text-soft">
                      {n.channel === 'sms' ? '📱 SMS' : '🔔 In-App'}
                    </span>
                    {n.created_at && (
                      <span className="text-xs text-text-soft">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-text-soft hover:text-teal flex-shrink-0 mt-1"
                    title="Mark as read"
                  >
                    <FiCheck size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
