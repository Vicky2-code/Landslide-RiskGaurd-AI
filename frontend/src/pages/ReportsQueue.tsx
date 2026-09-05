import { useState, useEffect } from 'react';
import { FiFileText, FiCheck, FiX, FiClock } from 'react-icons/fi';
import api from '../api';

interface Report { id: number; title: string; description: string; severity: string; status: string; photo_url: string | null; latitude: number | null; longitude: number | null; created_at: string; reporter: { id: number; name: string; email: string; }; }

export default function ReportsQueue() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    try { const res = await api.get('/reports', { params: { status: 'pending' } }); setReports(res.data); setError(''); }
    catch (e) { setError('Failed to load reports.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleAction = async (reportId: number, action: 'approve' | 'reject') => {
    try { await api.patch(`/reports/${reportId}/${action}`); setReports(prev => prev.filter(r => r.id !== reportId)); }
    catch (e) { console.error(e); }
  };

  const severityColor = (s: string) => s === 'critical' ? 'bg-risk-very-high text-risk-very-high' : s === 'high' ? 'bg-risk-high text-risk-high' : s === 'medium' ? 'bg-risk-medium text-risk-medium' : 'bg-risk-low text-risk-low';

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="font-serif text-xl md:text-2xl font-bold text-text">Reports Review Queue</h2>
        <p className="text-sm text-text-mute mt-1">Review and validate citizen-submitted reports</p>
      </div>
      {loading ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-text-mute text-sm">Loading reports...</div>
      ) : error ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-risk-very-high text-sm">{error}</div>
      ) : reports.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 md:p-12 text-center">
          <FiFileText size={48} className="mx-auto text-text-mute mb-4" />
          <p className="text-text font-medium">No Pending Reports</p>
          <p className="text-sm text-text-mute mt-1">All citizen reports have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {reports.map(report => (
            <div key={report.id} className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                {report.photo_url && (
                  <div className="w-full md:w-40 h-32 md:h-28 bg-bg rounded-lg overflow-hidden flex-shrink-0">
                    <img src={report.photo_url} alt={report.title} className="w-full h-full object-cover"/>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${severityColor(report.severity)}`}>{report.severity}</span>
                    <span className="text-xs text-text-mute">{report.reporter?.name || 'Unknown'}</span>
                  </div>
                  <h3 className="font-medium text-sm md:text-base text-text mb-1 truncate">{report.title}</h3>
                  <p className="text-sm text-text-mute line-clamp-2 mb-2">{report.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-mute">
                    <span className="flex items-center gap-1"><FiClock size={12}/>{new Date(report.created_at).toLocaleString()}</span>
                    {report.latitude != null && <span>Lat: {report.latitude.toFixed(4)}</span>}
                    {report.longitude != null && <span>Lon: {report.longitude.toFixed(4)}</span>}
                  </div>
                </div>
                <div className="flex md:flex-col gap-2 flex-shrink-0">
                  <button onClick={() => handleAction(report.id, 'approve')} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-risk-low text-white rounded-lg text-xs font-medium hover:bg-risk-low/90 transition-colors">
                    <FiCheck size={14}/> Approve
                  </button>
                  <button onClick={() => handleAction(report.id, 'reject')} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-card border border-border text-risk-very-high rounded-lg text-xs font-medium hover:bg-risk-very-high-bg transition-colors">
                    <FiX size={14}/> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
