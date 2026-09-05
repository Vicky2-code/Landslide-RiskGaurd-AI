import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { FiAlertTriangle, FiFileText, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import api, { Zone, Stats } from '../api';

const RISK_COLORS: Record<string, string> = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  very_high: '#dc2626',
};

const RISK_LABELS: Record<string, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
};

const RISK_BG: Record<string, string> = {
  low: '#dcfce7',
  moderate: '#fef9c3',
  high: '#ffedd5',
  very_high: '#fee2e2',
};

const STATES = ['All States', 'Meghalaya', 'Assam', 'Mizoram', 'Manipur', 'Nagaland', 'Arunachal Pradesh', 'Sikkim', 'Tripura'];
const RISK_LEVELS = ['All Levels', 'low', 'moderate', 'high', 'very_high'];

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 7); }, [center]);
  return null;
}

export default function Dashboard() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [stateFilter, setStateFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const pollRef = useRef<any>(null);

  const fetchData = async () => {
    try {
      const params: any = {};
      if (stateFilter && stateFilter !== 'All States') params.state = stateFilter;
      if (riskFilter && riskFilter !== 'All Levels') params.risk_level = riskFilter;
      const [zonesRes, statsRes] = await Promise.all([
        api.get('/zones', { params }),
        api.get('/stats/summary'),
      ]);
      setZones(zonesRes.data);
      setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [stateFilter, riskFilter]);

  useEffect(() => {
    pollRef.current = setInterval(fetchData, 30000);
    return () => clearInterval(pollRef.current);
  }, [stateFilter, riskFilter]);

  const center: [number, number] = zones.length > 0
    ? [zones.reduce((s, z) => s + z.lat, 0) / zones.length, zones.reduce((s, z) => s + z.lon, 0) / zones.length]
    : [25.5, 93.0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold text-text">Authority Dashboard</h2>
        <div className="flex gap-3">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-teal"
          >
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-teal"
          >
            {RISK_LEVELS.map((r) => (
              <option key={r} value={r}>{r === 'All Levels' ? r : RISK_LABELS[r] || r}</option>
            ))}
          </select>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="icon-badge bg-teal/10 text-teal"><FiMapPin /></div>
            <div>
              <div className="text-xs text-text-mute">Total Zones</div>
              <div className="font-serif text-2xl font-bold text-text">{stats.total_zones}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="icon-badge bg-risk-high-bg text-risk-high"><FiAlertTriangle /></div>
            <div>
              <div className="text-xs text-text-mute">High Risk</div>
              <div className="font-serif text-2xl font-bold text-text">{stats.high_risk_zones}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="icon-badge bg-amber/10 text-amber"><FiTrendingUp /></div>
            <div>
              <div className="text-xs text-text-mute">Active Alerts</div>
              <div className="font-serif text-2xl font-bold text-text">{stats.active_alerts}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="icon-badge bg-risk-low-bg text-risk-low"><FiFileText /></div>
            <div>
              <div className="text-xs text-text-mute">Pending Reports</div>
              <div className="font-serif text-2xl font-bold text-text">{stats.pending_reports}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ height: '480px' }}>
        <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          <MapUpdater center={center} />
          {zones.map((zone) => (
            <CircleMarker
              key={zone.id}
              center={[zone.lat, zone.lon]}
              radius={Math.max(6, zone.current_risk_score / 6)}
              fillColor={RISK_COLORS[zone.current_risk_level] || '#22c55e'}
              color={RISK_COLORS[zone.current_risk_level] || '#22c55e'}
              weight={2}
              fillOpacity={0.7}
            >
              <Popup>
                <div className="min-w-[180px] p-1">
                  <div className="font-semibold text-text text-sm">{zone.name}</div>
                  <div className="text-xs text-text-mute mb-2">{zone.district}, {zone.state}</div>
                  <span
                    className="risk-pill text-xs"
                    style={{ background: RISK_BG[zone.current_risk_level], color: RISK_COLORS[zone.current_risk_level] }}
                  >
                    {RISK_LABELS[zone.current_risk_level]} · {Math.round(zone.current_risk_score)}%
                  </span>
                  <div
                    className="text-teal text-xs mt-2 cursor-pointer hover:underline"
                    onClick={() => navigate(`/zones/${zone.id}`)}
                  >
                    View full zone detail →
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="bg-card border border-border rounded-xl">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-serif font-bold text-text">Zone Overview</h3>
        </div>
        <div className="divide-y divide-[#eef2f1]">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-bg/50 transition-colors"
              onClick={() => navigate(`/zones/${zone.id}`)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: RISK_COLORS[zone.current_risk_level] }}
                />
                <div>
                  <div className="text-sm font-medium text-text">{zone.name}</div>
                  <div className="text-xs text-text-mute">{zone.district}, {zone.state}</div>
                </div>
              </div>
              <span
                className="risk-pill"
                style={{ background: RISK_BG[zone.current_risk_level], color: RISK_COLORS[zone.current_risk_level] }}
              >
                {RISK_LABELS[zone.current_risk_level]} · {Math.round(zone.current_risk_score)}%
              </span>
            </div>
          ))}
          {zones.length === 0 && !loading && (
            <div className="px-6 py-8 text-center text-text-mute text-sm">No zones match the current filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
