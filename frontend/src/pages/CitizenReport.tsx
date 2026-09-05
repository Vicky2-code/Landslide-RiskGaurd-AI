import { useState } from 'react';
import { FiMapPin, FiCamera, FiNavigation, FiSend, FiCheckCircle } from 'react-icons/fi';
import api from '../api';

interface ReportForm { title: string; description: string; severity: 'low' | 'medium' | 'high' | 'critical'; latitude: string; longitude: string; photo: File | null; }

export default function CitizenReport() {
  const [form, setForm] = useState<ReportForm>({ title: '', description: '', severity: 'medium', latitude: '', longitude: '', photo: null });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const getGPS = () => {
    if (!navigator.geolocation) { setError('GPS not available'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setForm(f => ({ ...f, latitude: pos.coords.latitude.toFixed(5), longitude: pos.coords.longitude.toFixed(5) })); setGpsLoading(false); },
      () => { setGpsLoading(false); setError('Could not get GPS location. Please enter coordinates manually.'); }
    );
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, photo: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) { setError('Title and description are required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('severity', form.severity);
      if (form.latitude) fd.append('latitude', form.latitude);
      if (form.longitude) fd.append('longitude', form.longitude);
      if (form.photo) fd.append('photo', form.photo);
      await api.post('/reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit report.');
    } finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4">
      <div className="w-20 h-20 rounded-full bg-risk-low-bg flex items-center justify-center mb-6">
        <FiCheckCircle size={40} className="text-risk-low" />
      </div>
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-text text-center">Report Submitted</h2>
      <p className="text-sm text-text-mute mt-3 text-center max-w-sm">Thank you for contributing to community safety. Our team will review your report shortly.</p>
      <button onClick={() => { setSubmitted(false); setForm({ title: '', description: '', severity: 'medium', latitude: '', longitude: '', photo: null }); setPhotoPreview(null); }} className="mt-6 btn-primary px-8 py-3 text-center">
        Submit Another Report
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5 md:mb-8">
        <h2 className="font-serif text-xl md:text-2xl font-bold text-text mb-1">Report a Landslide Issue</h2>
        <p className="text-sm text-text-mute">Help us monitor landslide risks by reporting incidents or hazards in your area.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        {error && <div className="bg-risk-very-high-bg text-risk-very-high text-sm px-4 py-2.5 rounded-lg">{error}</div>}

        <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-sm text-text flex items-center gap-2"><FiMapPin className="text-teal" size={16}/>Issue Details</h3>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Title *</label>
            <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal bg-bg" placeholder="Brief description of the issue" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal bg-bg resize-y" placeholder="Provide more details about what you observed..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Severity</label>
            <select value={form.severity} onChange={(e) => setForm(f => ({ ...f, severity: e.target.value as any }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-bg focus:outline-none focus:border-teal">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-sm text-text flex items-center gap-2"><FiNavigation className="text-teal" size={16}/>Location</h3>
          <button type="button" onClick={getGPS} className="w-full sm:w-auto btn-ghost border border-border py-2.5 px-5 text-sm flex items-center justify-center gap-2" disabled={gpsLoading}>
            <FiNavigation size={14} className={gpsLoading ? 'animate-spin' : ''}/>
            {gpsLoading ? 'Getting Location...' : 'Use My Current Location'}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-mute mb-1">Latitude</label>
              <input value={form.latitude} onChange={(e) => setForm(f => ({ ...f, latitude: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg focus:outline-none focus:border-teal" placeholder="25.6700" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-mute mb-1">Longitude</label>
              <input value={form.longitude} onChange={(e) => setForm(f => ({ ...f, longitude: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg focus:outline-none focus:border-teal" placeholder="93.5800" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-sm text-text flex items-center gap-2"><FiCamera className="text-teal" size={16}/>Photo (Optional)</h3>
          <label className="flex flex-col items-center justify-center w-full h-32 md:h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-teal/50 transition-colors bg-bg">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-xl"/>
            ) : (
              <div className="text-center">
                <FiCamera size={24} className="mx-auto text-text-mute mb-2"/>
                <p className="text-xs text-text-mute">Tap to take a photo or upload an image</p>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden"/>
          </label>
        </div>

        <button type="submit" disabled={submitting} className="w-full btn-primary py-3 text-center flex items-center justify-center gap-2" >
          <FiSend size={16}/> {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
