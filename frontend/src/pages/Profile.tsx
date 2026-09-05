import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiLogOut, FiSave, FiAlertCircle } from 'react-icons/fi';
import api from '../api';

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(''); setMessage('');
    try { const res = await api.put('/auth/profile', { name, email }); setUser(res.data); setMessage('Profile updated.'); }
    catch (err: any) { setError(err.response?.data?.detail || 'Failed to update.'); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingPass(true); setError(''); setMessage('');
    try { await api.put('/auth/password', { current_password: currentPassword, new_password: newPassword }); setMessage('Password changed.'); setCurrentPassword(''); setNewPassword(''); }
    catch (err: any) { setError(err.response?.data?.detail || 'Failed to change password.'); }
    finally { setSavingPass(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="font-serif text-xl md:text-2xl font-bold text-text">Profile</h2>
        <p className="text-sm text-text-mute mt-1">Manage your account settings</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="w-20 h-20 bg-teal rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">{initials}</div>
        <div className="text-center sm:text-left">
          <h3 className="font-serif font-bold text-lg text-text">{user?.name}</h3>
          <p className="text-sm text-text-mute">{user?.email}</p>
          <span className="inline-block mt-1 px-3 py-1 bg-navy/10 text-navy text-xs font-medium rounded-full capitalize">{user?.role}</span>
        </div>
      </div>

      {(message || error) && (
        <div className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${message ? 'bg-risk-low-bg text-risk-low' : 'bg-risk-very-high-bg text-risk-very-high'}`}>
          {error ? <FiAlertCircle size={16}/> : <FiSave size={16}/>}
          {message || error}
        </div>
      )}

      <form onSubmit={handleProfile} className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-base text-text">Personal Information</h3>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Full Name</label>
          <div className="relative"><FiUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute"/><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal bg-bg" required/></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Email</label>
          <div className="relative"><FiMail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute"/><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal bg-bg" required/></div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
          <FiSave size={14}/> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <form onSubmit={handlePassword} className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-base text-text">Change Password</h3>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Current Password</label>
          <div className="relative"><FiLock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute"/><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal bg-bg" required/></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">New Password</label>
          <div className="relative"><FiLock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute"/><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal bg-bg" required minLength={6}/></div>
        </div>
        <button type="submit" disabled={savingPass} className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
          <FiLock size={14}/> {savingPass ? 'Changing...' : 'Change Password'}
        </button>
      </form>

      <button onClick={() => { logout(); navigate('/login'); }} className="w-full bg-card border border-border rounded-xl p-4 text-risk-very-high font-medium text-sm flex items-center justify-center gap-2 hover:bg-risk-very-high-bg transition-colors">
        <FiLogOut size={16}/> Sign Out
      </button>
    </div>
  );
}
