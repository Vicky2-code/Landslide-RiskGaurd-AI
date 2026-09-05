import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export interface Zone {
  id: number;
  name: string;
  state: string;
  district: string;
  lat: number;
  lon: number;
  current_risk_score: number;
  current_risk_level: string;
  updated_at?: string;
}

export interface ZoneDetail extends Zone {
  terrain?: { slope_angle: number; elevation_m: number; land_cover?: string };
  recent_rainfall: { precipitationCal: number; timestamp: string }[];
  recent_soil_moisture: { moisture_pct: number; timestamp: string }[];
  infrastructure: { type: string; name: string; population_estimate?: number }[];
}

export interface Alert {
  id: number;
  zone_id: number;
  zone_name?: string;
  risk_score_at_trigger: number;
  message_en: string;
  message_regional?: string;
  regional_language?: string;
  status: string;
  created_at: string;
}

export interface Report {
  id: number;
  zone_id?: number;
  user_id: number;
  lat: number;
  lon: number;
  issue_type: string;
  description?: string;
  photo_url?: string;
  status: string;
  synced: boolean;
  created_at: string;
}

export interface Stats {
  total_zones: number;
  high_risk_zones: number;
  active_alerts: number;
  pending_reports: number;
  total_reports: number;
  avg_risk_score: number;
  states_covered: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  channel: string;
  is_read: boolean;
  zone_id?: number;
  zone_name?: string;
  created_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}
