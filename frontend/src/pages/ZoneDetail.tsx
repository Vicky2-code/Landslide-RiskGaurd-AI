import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiAlertTriangle, FiClock, FiDroplet, FiCloud, FiActivity, FiInfo } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

interface ZoneDetail { id: number; name: string; state: string; latitude: number; longitude: number; current_risk_score: number; risk_level: string; contributing_factors: string[]; terrain_type: string; elevation_m: number; population_affected: number; infrastructure_risk: string; critical_infrastructure: string[]; latest_readings: { rainfall_mm: number; soil_moisture_pct: number; temperature_c: number; wind_speed_kmh: number; }; last_updated: string; }

function ScoreGauge({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const c = Math.PI * 2 * r;
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const color = score <= 25 ? '#10b981' : score <= 50 ? '#f59e0b' : score <= 75 ? '#f97316' : '#ef4444';
  const bg = score <= 25 ? '#d1fae5' : score <= 50 ? '#fef3c7' : score <= 75 ? '#ffedd5' : '#fee2e2';
  const label = score <= 25 ? 'Low' : score <= 50 ? 'Medium' : score <= 75 ? 'High' : 'Critical';
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={10} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-3xl md:text-4xl font-bold font-serif" style={{ color }}>{score}</span>
        <span className="text-xs font-medium mt-1" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

const factorsList = [
  { key: 'rainfall_intensity', label: 'Rainfall Intensity', icon: <FiCloud size={16}/>, desc: 'Heavy rainfall over short periods can saturate soil and trigger landslides. Intensity above 50mm/hr is high risk.' },
  { key: 'soil_saturation', label: 'Soil Saturation', icon: <FiDroplet size={16}/>, desc: 'When soil moisture exceeds 75%, the ground loses stability and becomes prone to slope failure.' },
  { key: 'slope_angle', label: 'Slope Angle', icon: <FiActivity size={16}/>, desc: 'Steep slopes above 30 degrees are significantly more susceptible to gravitational collapse.' },
  { key: 'vegetation_loss', label: 'Vegetation Loss', icon: <FiMapPin size={16}/>, desc: 'Deforestation and vegetation removal eliminates root systems that bind soil together.' },
  { key: 'historical_frequency', label: 'Historical Events', icon: <FiClock size={16}/>, desc: 'Areas with past landslides are statistically more likely to experience future events.' },
  { key: 'proximity_to_fault', label: 'Geological Proximity', icon: <FiAlertTriangle size={16}/>, desc: 'Proximity to active fault lines increases ground instability and seismic-induced landslide risk.' },
  { key: 'infrastructure_impact', label: 'Infrastructure Impact', icon: <FiInfo size={16}/>, desc: 'Built structures on slopes alter drainage patterns and add weight that can trigger failures.' },
];

export default function ZoneDetail() {
  const { id } = useParams();
  const [zone, setZone] = useState<ZoneDetail | null>(null);
  const [trend, setTrend] = useState<{timestamp: string; score: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFactorInfo, setShowFactorInfo] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchZone = async () => {
      try {
        const [zoneRes, trendRes] = await Promise.all([
          api.get(`/zones/${id}`), api.get(`/zones/${id}/trend`)
        ]);
        setZone(zoneRes.data);
        setTrend(trendRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchZone();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-text-mute">Loading zone details...</div>;
  if (!zone) return <div className="p-8 text-center text-risk-very-high">Zone not found.</div>;

  const contributing = zone.contributing_factors || [];
  const score = zone.current_risk_score;
  const color = score <= 25 ? '#10b981' : score <= 50 ? '#f59e0b' : score <= 75 ? '#f97316' : '#ef4444';
  const impactItems = [
    { label: 'Infrastructure', value: zone.infrastructure_risk },
    { label: 'Population at Risk', value: zone.population_affected?.toLocaleString() },
    { label: 'Elevation', value: zone.elevation_m ? `${zone.elevation_m}m` : 'N/A' },
    { label: 'Terrain', value: zone.terrain_type },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="p-2 border border-border rounded-lg hover:bg-bg text-text-mute hover:text-teal transition-colors">
          <FiArrowLeft size={16}/>
        </Link>
        <div className="min-w-0">
          <h1 className="font-serif font-bold text-base md:text-lg text-text truncate">{zone.name}</h1>
          <p className="text-xs text-text-mute flex items-center gap-1">
            <FiMapPin size={12}/> {zone.state}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Risk Score */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="font-serif font-bold text-sm md:text-base text-text mb-4">Current Risk Score</h3>
          <div className="flex flex-col items-center">
            <div className="relative">
              <ScoreGauge score={score} size={160} />
            </div>
            <p className="text-xs text-text-mute mt-3 text-center">Last updated {new Date(zone.last_updated).toLocaleString()}</p>
          </div>
        </div>

        {/* Contributing Factors */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="font-serif font-bold text-sm md:text-base text-text mb-4">Contributing Factors</h3>
          {contributing.length === 0 ? (
            <p className="text-sm text-text-mute">No significant contributing factors.</p>
          ) : (
            <div className="space-y-3">
              {contributing.map((key) => {
                const factor = factorsList.find(f => f.key === key);
                if (!factor) return null;
                return (
                  <div key={key} className="flex items-center gap-3 p-3 bg-bg rounded-lg border border-border group">
                    <div className="w-8 h-8 rounded-full bg-risk-high-bg flex items-center justify-center text-risk-high flex-shrink-0">
                      {factor.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-text">{factor.label}</div>
                      <div className="text-xs text-text-mute">Actively contributing to risk level</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShowFactorInfo(showFactorInfo === key ? null : key);
                      }}
                      className="p-1.5 rounded-full hover:bg-card border border-border text-text-mute hover:text-teal flex-shrink-0"
                    >
                      <FiInfo size={14}/>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
        <h3 className="font-serif font-bold text-sm md:text-base text-text mb-4">7-Day Trend</h3>
        {trend.length === 0 ? (
          <p className="text-sm text-text-mute text-center py-8">No trend data available.</p>
        ) : (
          <div className="h-[220px] sm:h-[260px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <ReTooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  labelFormatter={(t) => new Date(t).toLocaleString()} />
                <Line type="monotone" dataKey="score" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Impact Analysis */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
        <h3 className="font-serif font-bold text-sm md:text-base text-text mb-4">Impact Analysis</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {impactItems.map((item) => (
            <div key={item.label} className="bg-bg rounded-lg p-3 border border-border">
              <div className="text-xs text-text-mute mb-1">{item.label}</div>
              <div className="font-bold text-sm md:text-base text-text capitalize">{item.value}</div>
            </div>
          ))}
        </div>
        {zone.critical_infrastructure && zone.critical_infrastructure.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-text mb-2">Critical Infrastructure at Risk</h4>
            <div className="flex flex-wrap gap-2">
              {zone.critical_infrastructure.map((infra, i) => (
                <span key={i} className="px-3 py-1 bg-risk-high-bg text-risk-high text-xs font-medium rounded-lg border border-risk-high/20">
                  {infra}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Factor Info Panel */}
      {showFactorInfo && (
        <>
          <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setShowFactorInfo(null)} />
          <div ref={panelRef} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 md:p-6 z-40 max-h-[60vh] overflow-y-auto md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-[480px] md:rounded-2xl shadow-lg border border-border">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" />
            {(() => { const factor = factorsList.find(f => f.key === showFactorInfo); if (!factor) return null; return (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-risk-high-bg flex items-center justify-center text-risk-high">{factor.icon}</div>
                    <div><h3 className="font-serif font-bold text-base text-text">{factor.label}</h3></div>
                  </div>
                  <button onClick={() => setShowFactorInfo(null)} className="text-text-mute hover:text-text text-xl p-1">&times;</button>
                </div>
                <p className="text-sm text-text-mute leading-relaxed mb-4">{factor.desc}</p>
                <button onClick={() => setShowFactorInfo(null)} className="w-full btn-primary py-2 text-center text-sm">Got it</button>
              </div>
            ); })()}
          </div>
        </>
      )}
    </div>
  );
}
