import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FiArrowLeft, FiCloudRain, FiDroplet, FiTriangle, FiTrendingUp, FiMapPin, FiClock, FiHome, FiAlertTriangle, FiTruck, FiHeart } from 'react-icons/fi';
import api, { ZoneDetail as ZoneDetailType } from '../api';

const RISK_COLORS: Record<string, string> = { low: '#22c55e', moderate: '#eab308', high: '#f97316', very_high: '#dc2626' };
const RISK_BG: Record<string, string> = { low: '#dcfce7', moderate: '#fef9c3', high: '#ffedd5', very_high: '#fee2e2' };
const RISK_LABELS: Record<string, string> = { low: 'Low', moderate: 'Moderate', high: 'High', very_high: 'Very High' };

const INFRA_ICONS: Record<string, React.ReactNode> = {
  road: <FiTruck size={16} />,
  school: <FiHome size={16} />,
  hospital: <FiHeart size={16} />,
  village: <FiHome size={16} />,
};

function RiskGauge({ score, level }: { score: number; level: string }) {
  const color = RISK_COLORS[level] || '#22c55e';
  const radius = 70;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="#eef2f1"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
        <span className="font-serif text-4xl font-bold text-text">{Math.round(score)}</span>
        <span className="text-xs text-text-mute">/ 100</span>
      </div>
    </div>
  );
}

export default function ZoneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [zone, setZone] = useState<ZoneDetailType | null>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [impact, setImpact] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [zoneRes, trendRes, impactRes] = await Promise.all([
          api.get(`/zones/${id}`),
          api.get(`/zones/${id}/trend`),
          api.get(`/zones/${id}/impact`),
        ]);
        setZone(zoneRes.data);
        setTrend(trendRes.data);
        setImpact(impactRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) return <div className="text-center py-20 text-text-mute">Loading zone data...</div>;
  if (!zone) return <div className="text-center py-20 text-text-mute">Zone not found.</div>;

  const level = zone.current_risk_level;
  const color = RISK_COLORS[level] || '#22c55e';
  const bg = RISK_BG[level] || '#dcfce7';
  const label = RISK_LABELS[level] || level;

  const latestRain = zone.recent_rainfall[0]?.precipitationCal || 0;
  const latestMoisture = zone.recent_soil_moisture[0]?.moisture_pct || 0;
  const slopeAngle = zone.terrain?.slope_angle || 0;
  const elevation = zone.terrain?.elevation_m || 0;

  const getRainfallStatus = (val: number) => {
    if (val > 200) return 'extreme — well above threshold';
    if (val > 100) return 'high — above normal';
    if (val > 50) return 'moderate — within range';
    return 'low — below threshold';
  };

  const getMoistureStatus = (val: number) => {
    if (val > 80) return 'saturated';
    if (val > 60) return 'high moisture';
    if (val > 40) return 'moderate';
    return 'dry';
  };

  const getSlopeStatus = (val: number) => {
    if (val > 35) return 'very steep';
    if (val > 25) return 'steep';
    if (val > 15) return 'moderate';
    return 'gentle';
  };

  const trendUp = trend.length >= 2 && trend[trend.length - 1].score > trend[0].score;
  const trendDiff = trend.length >= 2 ? Math.round(trend[trend.length - 1].score - trend[0].score) : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-mute">
        <button onClick={() => navigate('/dashboard')} className="hover:text-teal transition-colors">Zones</button>
        <span>/</span>
        <span>{zone.state}</span>
        <span>/</span>
        <span className="text-text font-medium">{zone.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-text">{zone.name}, {zone.state}</h1>
          <div className="flex items-center gap-4 mt-1.5 text-sm text-text-mute">
            <span className="flex items-center gap-1">
              <FiMapPin size={13} />
              {zone.lat.toFixed(4)}° N, {zone.lon.toFixed(4)}° E
            </span>
            <span>·</span>
            <span>Zone ID: ZN-{String(zone.id).padStart(2, '0')}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <FiClock size={13} />
              Updated {zone.updated_at ? new Date(zone.updated_at).toLocaleTimeString() : 'just now'}
            </span>
          </div>
        </div>
        <span className="risk-pill text-sm" style={{ background: bg, color }}>
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          {label} risk
        </span>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-5">
          {/* Current Risk Score */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-serif font-bold text-text mb-4">Current risk score</h3>
            <div className="relative flex justify-center mb-4">
              <RiskGauge score={zone.current_risk_score} level={level} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="text-xs text-text-mute">Risk level</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-sm font-medium" style={{ color }}>{label}</span>
                </div>
              </div>
              {trend.length >= 2 && (
                <div className="text-right">
                  <div className="text-xs text-text-mute">Trend</div>
                  <div className={`text-sm font-medium flex items-center gap-1 ${trendUp ? 'text-risk-high' : 'text-risk-low'}`}>
                    {trendUp ? '↑' : '↓'} {Math.abs(trendDiff)} pts since {trend.length > 0 ? 'earlier' : 'yesterday'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contributing Factors */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-serif font-bold text-text mb-4">Contributing factors</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                  <FiCloudRain size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">Rainfall (24h)</div>
                  <div className="text-xs text-text-mute mt-0.5">{latestRain.toFixed(0)} mm — {getRainfallStatus(latestRain)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-500 flex-shrink-0">
                  <FiDroplet size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">Soil moisture</div>
                  <div className="text-xs text-text-mute mt-0.5">{latestMoisture.toFixed(0)}% — {getMoistureStatus(latestMoisture)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
                  <FiTriangle size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">Slope angle</div>
                  <div className="text-xs text-text-mute mt-0.5">{slopeAngle}° — {getSlopeStatus(slopeAngle)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 flex-shrink-0">
                  <FiTrendingUp size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">Rainfall trend (7d)</div>
                  <div className="text-xs text-text-mute mt-0.5">{trendUp ? 'Rising sharply' : 'Declining'} since earlier this week</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 flex-shrink-0">
                  <FiMapPin size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">Elevation</div>
                  <div className="text-xs text-text-mute mt-0.5">{elevation.toFixed(0)}m above sea level</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column — Trend Chart */}
        <div className="lg:col-span-5">
          <div className="bg-card border border-border rounded-xl p-6 h-full">
            <h3 className="font-serif font-bold text-text mb-4">7-day risk trend</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f1" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#5b6f6a' }}
                    tickFormatter={(d) => {
                      const date = new Date(d);
                      return date.toLocaleDateString('en-US', { weekday: 'short' });
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#5b6f6a' }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Risk Score']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #dbe5e2', fontSize: '12px' }}
                  />
                  <ReferenceLine
                    y={70}
                    stroke="#f97316"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    label={{ value: 'Alert threshold (70)', position: 'right', fill: '#f97316', fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column — Impact Analysis */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-xl p-6 h-full">
            <h3 className="font-serif font-bold text-text mb-4">Impact analysis</h3>
            {impact.length === 0 ? (
              <p className="text-text-mute text-sm">No infrastructure data available.</p>
            ) : (
              <div className="space-y-3">
                {impact.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-bg rounded-lg">
                    <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center text-teal flex-shrink-0">
                      {INFRA_ICONS[item.type] || <FiHome size={16} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text truncate">{item.name}</div>
                      <div className="text-xs text-text-mute mt-0.5">
                        {item.type === 'road' && 'Primary highway, moderate traffic'}
                        {item.type === 'village' && `Pop. ~${(item.population_estimate || 0).toLocaleString()}`}
                        {item.type === 'hospital' && 'Critical access facility'}
                        {item.type === 'school' && 'Education facility'}
                        {item.type !== 'road' && item.type !== 'village' && item.type !== 'hospital' && item.type !== 'school' && `${item.type} — nearby`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
