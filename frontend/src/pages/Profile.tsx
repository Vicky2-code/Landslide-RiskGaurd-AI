import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiSave, FiUser, FiMail, FiLock, FiShield, FiCheck } from 'react-icons/fi';
import api from '../api';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/auth/profile', { name, email });
      const updated = { ...user!, name, email };
      localStorage.setItem('user', JSON.stringify(updated));
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/auth/password', { current_password: currentPass, new_password: newPass });
      setSuccess('Password changed successfully');
      setCurrentPass('');
      setNewPass('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-mute hover:text-text text-sm">
        <FiArrowLeft /> Back
      </button>

      <h2 className="font-serif text-2xl font-bold text-text">My Profile</h2>

      {/* Profile Header Card */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-5">
        <div className="w-20 h-20 bg-teal rounded-full flex items-center justify-center text-white text-2xl font-bold font-serif">
          {initials}
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold text-text">{user?.name}</h3>
          <p className="text-sm text-text-mute">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            {user?.role === 'authority' ? <FiShield size={14} className="text-teal" /> : <FiUser size={14} className="text-teal" />}
            <span className="text-xs font-medium text-teal capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-risk-low-bg text-risk-low text-sm px-4 py-2.5 rounded-lg flex items-center gap-2">
          <FiCheck size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="bg-risk-very-high-bg text-risk-very-high text-sm px-4 py-2.5 rounded-lg">{error}</div>
      )}

      {/* Edit Profile */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-serif font-bold text-text mb-4">Edit Information</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Full Name</label>
            <div className="relative">
              <FiUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal bg-card"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Email</label>
            <div className="relative">
              <FiMail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal bg-card"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <FiSave size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-serif font-bold text-text mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Current Password</label>
            <div className="relative">
              <FiLock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" />
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal bg-card"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">New Password</label>
            <div className="relative">
              <FiLock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" />
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-teal bg-card"
                placeholder="Min 6 characters"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <FiLock size={16} /> {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-serif font-bold text-text mb-3">Account Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-mute">Role</span>
            <span className="font-medium text-text capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-mute">User ID</span>
            <span className="font-medium text-text">#{user?.id}</span>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="mt-4 w-full py-2.5 border border-risk-very-high text-risk-very-high rounded-lg text-sm font-medium hover:bg-risk-very-high-bg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
