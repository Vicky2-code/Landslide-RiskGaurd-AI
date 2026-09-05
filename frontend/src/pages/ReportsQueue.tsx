import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiEye } from 'react-icons/fi';
import api, { Report } from '../api';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#fef9c3', text: '#d97706', label: 'Pending' },
  reviewed: { bg: '#dbeafe', text: '#2563eb', label: 'Reviewed' },
  resolved: { bg: '#dcfce7', text: '#16a34a', label: 'Resolved' },
  rejected: { bg: '#fee2e2', text: '#dc2626', label: 'Rejected' },
};

export default function ReportsQueue() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      const res = await api.get('/reports', { params });
      setReports(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/reports/${id}?status=${status}`);
      fetchReports();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold text-text">Reports Review Queue</h2>
        <div className="flex gap-2">
          {['pending', 'all', 'reviewed', 'resolved', 'rejected'].map((f) => (
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
        <div className="text-center py-20 text-text-mute">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 text-text-mute">No reports in this category.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-[#eef2f1]">
            {reports.map((report) => {
              const status = STATUS_COLORS[report.status] || STATUS_COLORS.pending;
              return (
                <div key={report.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-sm text-text">{report.issue_type}</span>
                      <span
                        className="risk-pill text-xs"
                        style={{ background: status.bg, color: status.text }}
                      >
                        {status.label}
                      </span>
                    </div>
                    {report.description && (
                      <p className="text-xs text-text-mute mb-1 line-clamp-1">{report.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-text-soft">
                      <span>{report.lat.toFixed(4)}, {report.lon.toFixed(4)}</span>
                      <span>{new Date(report.created_at).toLocaleString()}</span>
                      {report.photo_url && <span className="text-teal">Has photo</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {report.status === 'pending' ? (
                      <>
                        <button onClick={() => updateStatus(report.id, 'resolved')} className="btn-approve flex items-center gap-1">
                          <FiCheck size={12} /> Approve
                        </button>
                        <button onClick={() => updateStatus(report.id, 'rejected')} className="btn-reject flex items-center gap-1">
                          <FiX size={12} /> Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-text-soft">View →</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
