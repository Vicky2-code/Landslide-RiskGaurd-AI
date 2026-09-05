import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiCheck, FiClock } from 'react-icons/fi';
import api, { Alert } from '../api';

const RISK_COLORS: Record<string, string> = { low: '#22c55e', moderate: '#eab308', high: '#f97316', very_high: '#dc2626' };

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const pollRef = useRef<any>(null);

  const fetchAlerts = async () => {
    try {
      const params: any = {};
      if (filter === 'active') params.status = 'sent';
      if (filter === 'acknowledged') params.status = 'acknowledged';
      const res = await api.get('/alerts', { params });
      setAlerts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [filter]);

  useEffect(() => {
    pollRef.current = setInterval(fetchAlerts, 15000);
    return () => clearInterval(pollRef.current);
  }, [filter]);

  const acknowledge = async (id: number) => {
    try {
      await api.patch(`/alerts/${id}`);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return RISK_COLORS.very_high;
    if (score >= 50) return RISK_COLORS.high;
    if (score >= 25) return RISK_COLORS.moderate;
    return RISK_COLORS.low;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold text-text">Alerts</h2>
        <div className="flex gap-2">
          {['all', 'active', 'acknowledged'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f ? 'bg-teal text-white' : 'bg-card border border-border text-text-mute hover:text-text'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-mute">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20">
          <FiAlertTriangle className="mx-auto text-text-soft mb-3" size={40} />
          <p className="text-text-mute">No alerts in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: getRiskColor(alert.risk_score_at_trigger) }}
                    />
                    <span
                      className="risk-pill"
                      style={{
                        background: getRiskColor(alert.risk_score_at_trigger) + '20',
                        color: getRiskColor(alert.risk_score_at_trigger),
                      }}
                    >
                      Score: {Math.round(alert.risk_score_at_trigger)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      alert.status === 'sent'
                        ? 'bg-risk-high-bg text-risk-high'
                        : 'bg-risk-low-bg text-risk-low'
                    }`}>
                      {alert.status === 'sent' ? 'Active' : 'Acknowledged'}
                    </span>
                  </div>
                  <p className="text-sm text-text mb-1">{alert.message_en}</p>
                  {alert.message_regional && (
                    <p className="text-xs text-text-mute italic">{alert.message_regional} ({alert.regional_language})</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-text-soft">
                    <span>{alert.zone_name}</span>
                    <span className="flex items-center gap-1">
                      <FiClock size={12} />
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/zones/${alert.zone_id}`)}
                    className="text-teal text-xs hover:underline"
                  >
                    View Zone →
                  </button>
                  {alert.status === 'sent' && (
                    <button
                      onClick={() => acknowledge(alert.id)}
                      className="btn-approve flex items-center gap-1"
                    >
                      <FiCheck size={12} /> Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
