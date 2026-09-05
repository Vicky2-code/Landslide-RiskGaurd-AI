import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FiRefreshCw, FiAlertTriangle, FiMapPin, FiFilter, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import api from '../api';

interface Zone {
  id: number; name: string; state: string; latitude: number; longitude: number;
  current_risk_score: number; last_updated: string;
  latest_readings: { rainfall_mm: number; soil_moisture_pct: number; };
}

function ScoreLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-sm w-full md:w-auto">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full md:cursor-default"
      >
        <span className="text-xs font-medium text-text">Risk Score Legend</span>
        <span className="md:hidden text-text-mute">{open ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}</span>
      </button>
      <div className={`${open ? 'block' : 'hidden'} md:block mt-2 space-y-1.5`}>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-risk-low"/><span className="text-xs text-text-mute">Low (0–25)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-risk-medium"/><span className="text-xs text-text-mute">Medium (26–50)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-risk-high"/><span className="text-xs text-text-mute">High (51–75)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-risk-very-high"/><span className="text-xs text-text-mute">Critical (76–100)</span></div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stateParam = searchParams.get('state') || '';
  const riskParam = searchParams.get('risk') || '';
  const [zones, setZones] = useState<Zone[]>([]);
  const [summary, setSummary] = useState({ totalZones: 0, highRiskCount: 0, activeAlerts: 0, citizenReports: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const params: any = {};
        if (stateParam) params.state = stateParam;
        if (riskParam) params.risk = riskParam;
        const [zonesRes, statsRes] = await Promise.all([
          api.get('/zones', { params }), api.get('/stats/summary')
        ]);
        setZones(zonesRes.data);
        setSummary(statsRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [stateParam, riskParam]);

  const riskColor = (score: number) => score <= 25 ? '#10b981' : score <= 50 ? '#f59e0b' : score <= 75 ? '#f97316' : '#ef4444';
  const states = [...new Set(zones.map(z => z.state))].sort();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card border border-border rounded-xl p-3 md:p-4 shadow-sm">
          <div className="text-xs text-text-mute font-medium mb-1">Total Zones</div>
          <div className="text-xl md:text-2xl font-bold font-serif text-text">{summary.totalZones}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 md:p-4 shadow-sm">
          <div className="text-xs text-text-mute font-medium mb-1">High Risk</div>
          <div className="text-xl md:text-2xl font-bold font-serif text-risk-high">{summary.highRiskCount}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 md:p-4 shadow-sm">
          <div className="text-xs text-text-mute font-medium mb-1">Active Alerts</div>
          <div className="flex items-center gap-2">
            <div className="text-xl md:text-2xl font-bold font-serif text-risk-very-high">{summary.activeAlerts}</div>
            {summary.activeAlerts > 0 && (
              <span className="relative flex h-3 w-3 hidden md:block">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-very-high opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-risk-very-high"></span>
              </span>
            )}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 md:p-4 shadow-sm">
          <div className="text-xs text-text-mute font-medium mb-1">Citizen Reports</div>
          <div className="text-xl md:text-2xl font-bold font-serif text-text">{summary.citizenReports}</div>
        </div>
      </div>

      {/* Map + Legend */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-3 md:p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-sm md:text-base text-text">Monitored Zones</h2>
            <div className="hidden md:block"><ScoreLegend /></div>
          </div>
        </div>
        <div className="h-[280px] sm:h-[340px] md:h-[400px]">
          <MapContainer center={[25.6, 93.0]} zoom={7} className="h-full w-full" zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            {zones.map((zone) => (
              <CircleMarker
                key={zone.id}
                center={[zone.latitude, zone.longitude]}
                radius={Math.max(7, zone.current_risk_score / 5)}
                pathOptions={{ color: riskColor(zone.current_risk_score), fillColor: riskColor(zone.current_risk_score), fillOpacity: 0.85, weight: 2, opacity: 0.9 }}
              >
                <Tooltip direction="top" offset={[0, -10]} className="leaflet-tooltip">
                  <div style={{ fontWeight: 600 }}>{zone.name}</div>
                  <div>Score: {zone.current_risk_score}/100</div>
                  <div>Rain: {zone.latest_readings?.rainfall_mm ?? 0} mm</div>
                  <div>Moisture: {zone.latest_readings?.soil_moisture_pct ?? 0}%</div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        {/* Mobile legend below map */}
        <div className="md:hidden p-3 border-t border-border">
          <ScoreLegend />
        </div>
      </div>

      {/* Zone List */}
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="p-3 md:p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <FiMapPin size={16} className="text-teal"/>
              <h2 className="font-serif font-bold text-sm md:text-base text-text">All Monitored Zones</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
              <div className="relative flex-1 sm:flex-none">
                <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute"/>
                <input
                  type="text"
                  placeholder="Search zones..."
                  className="pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs bg-bg w-full sm:w-40 focus:outline-none focus:border-teal"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden btn-ghost border border-border py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <FiFilter size={14}/> Filters
              </button>
              <select
                value={stateParam}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchParams(prev => { const p = new URLSearchParams(prev); v ? p.set('state', v) : p.delete('state'); return p; });
                }}
                className="border border-border rounded-lg px-3 py-1.5 text-xs bg-bg focus:outline-none focus:border-teal"
              >
                <option value="">All States</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={riskParam}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchParams(prev => { const p = new URLSearchParams(prev); v ? p.set('risk', v) : p.delete('risk'); return p; });
                }}
                className="border border-border rounded-lg px-3 py-1.5 text-xs bg-bg focus:outline-none focus:border-teal hidden sm:block"
              >
                <option value="">All Risks</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button onClick={() => window.location.reload()} className="btn-ghost border border-border py-1.5 px-3 text-xs flex items-center gap-1">
                <FiRefreshCw size={14}/> Refresh
              </button>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-text-mute text-sm">Loading zones...</div>
        ) : zones.length === 0 ? (
          <div className="p-8 text-center text-text-mute text-sm">No zones found.</div>
        ) : (
          <div className="divide-y divide-border">
            {zones.map((zone) => (
              <Link
                key={zone.id}
                to={`/zones/${zone.id}`}
                className="flex items-center justify-between p-3 md:p-4 hover:bg-bg transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: riskColor(zone.current_risk_score) }} />
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-text group-hover:text-teal transition-colors truncate">{zone.name}</div>
                    <div className="text-xs text-text-mute">{zone.state}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-base md:text-lg font-bold font-serif" style={{ color: riskColor(zone.current_risk_score) }}>
                    {zone.current_risk_score}
                  </div>
                  <div className="text-[10px] text-text-mute">{new Date(zone.last_updated).toLocaleTimeString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
