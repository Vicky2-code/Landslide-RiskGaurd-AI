import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiMap, FiAlertTriangle, FiFileText, FiLogOut, FiShield, FiBell, FiMenu, FiX, FiMapPin } from 'react-icons/fi';
import api from '../api';

export default function Layout() {
  const { user, logout, isAuthority } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pollRef = useRef<any>(null);

  const fetchUnread = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUnread();
    pollRef.current = setInterval(fetchUnread, 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  const navItems = [
    { to: '/dashboard', icon: <FiMap size={18} />, label: 'Dashboard' },
    { to: '/alerts', icon: <FiAlertTriangle size={18} />, label: 'Alerts' },
    { to: '/report', icon: <FiFileText size={18} />, label: 'Report Issue' },
    { to: '/notifications', icon: <FiBell size={18} />, label: 'Notifications', badge: unreadCount },
    ...(isAuthority ? [{ to: '/reports', icon: <FiShield size={18} />, label: 'Review Queue' }] : []),
  ];

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static w-[220px] h-full bg-navy flex flex-col z-30 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal rounded-full flex items-center justify-center">
              <FiMapPin className="text-white" size={18} />
            </div>
            <div>
              <span className="font-serif text-white font-bold text-lg leading-none">RiskGuard</span>
              <span className="text-[10px] text-teal font-semibold ml-1">AI</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white">
            <FiX size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {'badge' in item && (item as any).badge > 0 && (
                <span className="bg-risk-very-high text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {(item as any).badge > 99 ? '99+' : (item as any).badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-4">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="sidebar-link w-full text-left"
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 md:h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-text-mute hover:text-teal"
            >
              <FiMenu size={20} />
            </button>
            <h1 className="font-serif font-bold text-base md:text-lg text-text">RiskGuard</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 text-text-mute hover:text-teal transition-colors"
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-risk-very-high text-white text-[9px] font-bold rounded-full flex items-center justify-center min-w-[16px] h-4 px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <div className="w-px h-6 md:h-8 bg-border hidden sm:block" />
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 md:w-8 md:h-8 bg-teal rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-bold">
                {initials}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs md:text-sm font-medium text-text">{user?.name}</div>
                <div className="text-[10px] md:text-xs text-text-mute capitalize">{user?.role}</div>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
