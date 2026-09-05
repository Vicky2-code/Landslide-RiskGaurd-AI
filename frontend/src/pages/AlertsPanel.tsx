import { useState, useEffect, useRef } from 'react';
import { FiAlertTriangle, FiClock, FiCheckCircle } from 'react-icons/fi';
import api from '../api';

interface Alert { id: number; zone_id: number; zone_name: string; risk_score: number; message: string; severity: string; status: string; created_at: string; }

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('all');
  const pollRef = useRef<any>(null);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts', { params: filter === 'all' ? {} : { status: filter } });
      setAlerts(res.data);
      setError('');
    } catch (e) { setError('Failed to load alerts.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); pollRef.current = setInterval(fetchAlerts, 30000); return () => clearInterval(pollRef.current); }, [filter]);

  const acknowledge = async (alertId: number) => {
    try { await api.patch(`/alerts/${alertId}/acknowledge`); setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'acknowledged' } : a)); }
    catch (e) { console.error(e); }
  };

  const severityColor = (s: string) => s === 'critical' ? 'bg-risk-very-high text-risk-very-high' : s === 'high' ? 'bg-risk-high text-risk-high' : s === 'medium' ? 'bg-risk-medium text-risk-medium' : 'bg-risk-low text-risk-low';
  const severityIcon = (s: string) => s === 'critical' ? '🔴' : s === 'high' ? '🟠' : s === 'medium' ? '🟡' : '🟢';

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-text">Active Alerts</h2>
          <p className="text-sm text-text-mute mt-1">Critical risk notifications requiring attention</p>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {(['all', 'active', 'acknowledged'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${filter === f ? 'bg-navy text-white border-navy' : 'bg-card text-text-mute border-border hover:border-navy/50'}`}>{f}</button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-text-mute text-sm">Loading alerts...</div>
      ) : error ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-risk-very-high text-sm">{error}</div>
      ) : alerts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 md:p-12 text-center">
          <FiCheckCircle size={48} className="mx-auto text-risk-low mb-4" />
          <p className="text-text font-medium">No Active Alerts</p>
          <p className="text-sm text-text-mute mt-1">All monitored zones are currently within safe risk levels.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${severityColor(alert.severity)}`}>{alert.severity}</span>
                    <span className="text-xs text-text-mute flex items-center gap-1"><FiClock size={12}/>{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                  <h3 className="font-medium text-sm md:text-base text-text mb-1">{alert.zone_name} — Risk Score: {alert.risk_score}/100</h3>
                  <p className="text-sm text-text-mute">{alert.message}</p>
                </div>
                {alert.status !== 'acknowledged' && (
                  <button onClick={() => acknowledge(alert.id)} className="btn-ghost border border-border py-2 px-4 text-xs flex items-center justify-center gap-1.5 flex-shrink-0 hover:border-teal/50">
                    <FiCheckCircle size={14}/> Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
