import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiMapPin, FiWifiOff, FiSend } from 'react-icons/fi';
import api, { Zone } from '../api';

const ISSUE_TYPES = ['Road Blockage', 'Slope Failure', 'Rockfall', 'Mudslide', 'Crack in Hillside', 'Water Logging', 'Other'];

export default function CitizenReport() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState<number | ''>('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/zones').then((res) => setZones(res.data)).catch(() => {});
    const handleOnline = () => { setIsOnline(true); flushOfflineQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const queue = localStorage.getItem('offline_reports');
    if (queue) setOfflineQueue(JSON.parse(queue));
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const flushOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('offline_reports') || '[]');
    for (const report of queue) {
      try {
        const formData = new FormData();
        formData.append('lat', report.lat);
        formData.append('lon', report.lon);
        formData.append('issue_type', report.issue_type);
        formData.append('description', report.description || '');
        if (report.zone_id) formData.append('zone_id', String(report.zone_id));
        await api.post('/reports', formData);
      } catch (e) {
        console.error('Failed to flush offline report', e);
      }
    }
    localStorage.removeItem('offline_reports');
    setOfflineQueue([]);
  };

  const useGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        setGpsLoading(false);
      },
      () => {
        setLat('25.5788');
        setLon('91.8933');
        setGpsLoading(false);
      }
    );
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueType || !lat || !lon) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');

    const reportData = {
      zone_id: zoneId || null,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      issue_type: issueType,
      description,
    };

    if (!isOnline) {
      const queue = [...offlineQueue, reportData];
      setOfflineQueue(queue);
      localStorage.setItem('offline_reports', JSON.stringify(queue));
      setSuccess(true);
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('lat', lat);
      formData.append('lon', lon);
      formData.append('issue_type', issueType);
      formData.append('description', description || '');
      if (zoneId) formData.append('zone_id', String(zoneId));
      if (photo) formData.append('photo', photo);
      await api.post('/reports', formData);
      setSuccess(true);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 bg-risk-low-bg rounded-full flex items-center justify-center mx-auto mb-4">
          <FiSend className="text-risk-low" size={24} />
        </div>
        <h2 className="font-serif text-xl font-bold text-text mb-2">Report Submitted</h2>
        <p className="text-text-mute text-sm mb-6">Thank you for your report. Authorities will review it shortly.</p>
        <button onClick={() => { setSuccess(false); setZoneId(''); setLat(''); setLon(''); setIssueType(''); setDescription(''); setPhoto(null); setPhotoPreview(null); }} className="btn-primary">
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="font-serif text-2xl font-bold text-text mb-6">Report an Issue</h2>

      {!isOnline && (
        <div className="bg-amber/10 border border-amber/30 text-amber text-sm px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
          <FiWifiOff /> You are offline. Reports will be queued and sent when reconnected.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">Zone (optional)</label>
          <select value={zoneId} onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : '')} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-teal">
            <option value="">Select nearest zone</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}, {z.district}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Latitude *</label>
            <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal" placeholder="25.5788" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Longitude *</label>
            <input type="number" step="any" value={lon} onChange={(e) => setLon(e.target.value)} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal" placeholder="91.8933" required />
          </div>
        </div>

        <button type="button" onClick={useGPS} disabled={gpsLoading} className="btn-secondary w-full flex items-center justify-center gap-2">
          <FiMapPin /> {gpsLoading ? 'Getting location...' : 'Use GPS'}
        </button>

        {(lat && lon) && (
          <div className="bg-bg border border-border rounded-lg p-3 text-xs text-text-mute">
            Location: {parseFloat(lat).toFixed(4)}, {parseFloat(lon).toFixed(4)}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text mb-1">Issue Type *</label>
          <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-teal" required>
            <option value="">Select issue type</option>
            {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal resize-none" rows={3} placeholder="Describe what you see..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Photo</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-teal transition-colors"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
            ) : (
              <>
                <FiCamera className="mx-auto text-text-soft mb-2" size={24} />
                <p className="text-text-mute text-sm">Tap to add a photo</p>
              </>
            )}
          </div>
        </div>

        {error && <div className="bg-risk-very-high-bg text-risk-very-high text-sm px-4 py-2 rounded-lg">{error}</div>}

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-center disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
