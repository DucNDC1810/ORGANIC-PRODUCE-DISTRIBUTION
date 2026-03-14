import { useState, useEffect, useRef } from 'react';
import { User, Phone, Mail, Home, Edit2, Save, X, Camera, Shield, Lock, Unlock, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../Axios/Axios';
import { toast } from 'sonner';
import api from '../../services/api';

// ─── Session timeout stored in localStorage ───────────────────────────────────
const SESSION_TIMEOUT_KEY = 'admin_session_timeout_minutes';
const DEFAULT_TIMEOUT = 30;
const SESSION_TIMEOUT_TOAST_ID = 'admin-session-timeout-toast';

interface LockedUser {
  _id: string;
  name: string;
  email: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
}

export default function AdminSettings() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Security Settings state ────────────────────────────────────────────────
  const [sessionTimeout, setSessionTimeout] = useState<number>(
    parseInt(localStorage.getItem(SESSION_TIMEOUT_KEY) || String(DEFAULT_TIMEOUT))
  );
  const [timeoutDraft, setTimeoutDraft] = useState<number>(
    parseInt(localStorage.getItem(SESSION_TIMEOUT_KEY) || String(DEFAULT_TIMEOUT))
  );
  const [maxAttempts, setMaxAttempts] = useState<number>(5);
  const [maxAttemptsDraft, setMaxAttemptsDraft] = useState<number>(5);
  const [savingSecConfig, setSavingSecConfig] = useState(false);
  const [lockedUsers, setLockedUsers] = useState<LockedUser[]>([]);
  const [loadingLocked, setLoadingLocked] = useState(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLockedUsers();
    fetchSecurityConfig();
  }, []);

  const fetchSecurityConfig = async () => {
    try {
      const res = await api.get('/users/security-config') as any;
      const cfg = res.data;
      setMaxAttempts(cfg.maxLoginAttempts);
      setMaxAttemptsDraft(cfg.maxLoginAttempts);
    } catch {
      // silently ignore
    }
  };

  const handleSaveSecurityConfig = async () => {
    if (maxAttemptsDraft < 1 || maxAttemptsDraft > 20) {
      toast.error('Max login attempts must be between 1 and 20');
      return;
    }
    setSavingSecConfig(true);
    try {
      await api.patch('/users/security-config', {
        maxLoginAttempts: maxAttemptsDraft,
      });
      setMaxAttempts(maxAttemptsDraft);
      toast.success('Security configuration saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save security config');
    } finally {
      setSavingSecConfig(false);
    }
  };

  const fetchLockedUsers = async () => {
    setLoadingLocked(true);
    try {
      const res = await api.get('/users/locked') as any;
      setLockedUsers(res.data ?? []);
    } catch {
      // silently ignore
    } finally {
      setLoadingLocked(false);
    }
  };

  const handleSaveTimeout = () => {
    if (timeoutDraft < 1 || timeoutDraft > 1440) {
      toast.error('Session timeout must be between 1 and 1440 minutes', {
        id: SESSION_TIMEOUT_TOAST_ID,
      });
      return;
    }
    localStorage.setItem(SESSION_TIMEOUT_KEY, String(timeoutDraft));
    setSessionTimeout(timeoutDraft);
    toast.success(`Session timeout set to ${timeoutDraft} minutes`, {
      id: SESSION_TIMEOUT_TOAST_ID,
    });
  };

  const handleUnlockUser = async (userId: string) => {
    setUnlockingId(userId);
    try {
      await api.patch(`/users/${userId}/unlock`);
      toast.success('User account unlocked successfully');
      setLockedUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to unlock user');
    } finally {
      setUnlockingId(null);
    }
  };

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar: user?.avatar || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      });
    }
  }, [user]);

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
        avatar: user?.avatar || '',
        gender: user?.gender || '',
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const updateData = {
        ...formData,
        gender: (formData.gender || undefined) as 'male' | 'female' | 'other' | undefined,
      };
      const updatedUser = await userAPI.updateUser(user._id, updateData);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarClick = () => {
    if (isEditing) fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image size must be less than 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      toast.success('Avatar updated! Click Save to apply changes.');
    };
    reader.onerror = () => toast.error('Error reading file');
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Account Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your admin profile, security and preferences</p>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEditToggle}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleEditToggle}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: PROFILE INFORMATION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Profile Information</h3>
              <p className="text-xs text-gray-600">Your personal details and contact information</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Avatar Section */}
            <div className="lg:col-span-1 flex flex-col items-center">
              <div className="relative w-full max-w-[200px]">
                <div
                  onClick={handleAvatarClick}
                  className={`relative ${isEditing ? 'cursor-pointer group' : ''}`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  {formData.avatar || user?.avatar ? (
                    <img
                      src={formData.avatar || user?.avatar}
                      alt="Avatar"
                      className="w-full aspect-square rounded-2xl object-cover border-4 border-white shadow-xl"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=10b981&color=fff&size=400`;
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center border-4 border-white shadow-xl">
                      <span className="text-5xl font-bold text-white">{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                    </div>
                  )}
                  {isEditing && (
                    <>
                      <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Camera className="w-10 h-10 text-white" />
                        <span className="text-sm text-white font-medium">Change Photo</span>
                      </div>
                      <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                        <Edit2 className="w-5 h-5 text-white" />
                      </div>
                    </>
                  )}
                </div>
                {isEditing && (
                  <p className="text-xs text-center text-gray-400 mt-3">
                    <Camera className="w-3 h-3 inline mr-1" />
                    Max 2MB, JPG/PNG
                  </p>
                )}
              </div>
              
              {/* Role Badge */}
              <div className="mt-6 w-full max-w-[200px]">
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700 uppercase tracking-wide">
                    {user?.role || 'Admin'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <User className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-800">{user?.name || 'Not set'}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Email Address</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-800">{user?.email || 'Not set'}</span>
                  </div>
                  {isEditing && <p className="text-xs text-gray-500 mt-1.5 ml-1">Email cannot be changed</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-800">{user?.phone || 'Not set'}</span>
                    </div>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Gender</label>
                  {isEditing ? (
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <User className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-800">
                        {user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not set'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <User className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-800">
                        {user?.dateOfBirth
                          ? new Date(user.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'Not set'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Address</label>
                  {isEditing ? (
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                      placeholder="Enter your address"
                      rows={3}
                    />
                  ) : (
                    <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <Home className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-gray-800">{user?.address || 'Not set'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: SECURITY & SYSTEM SETTINGS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Security & System Settings</h3>
              <p className="text-xs text-gray-600">Manage login security, session timeout and locked accounts</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{/* Login Attempt Limits */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Login Attempts</h4>
                  <p className="text-xs text-gray-500">Max failed logins</p>
                </div>
              </div>
              
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="text-center mb-3">
                  <div className="text-3xl font-bold text-red-600">{maxAttempts}</div>
                  <p className="text-xs text-gray-600 mt-1">attempts before lockout</p>
                </div>
                
                {/* Input */}
                <div className="space-y-2 mb-3">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={maxAttemptsDraft}
                    onChange={(e) => setMaxAttemptsDraft(Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-red-200 rounded-lg text-sm font-semibold text-center focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                  />
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {[3, 5, 10, 15].map(val => (
                      <button
                        key={val}
                        onClick={() => setMaxAttemptsDraft(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border-2 ${
                          maxAttemptsDraft === val
                            ? 'bg-red-500 text-white border-red-500 shadow-md'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveSecurityConfig}
                  disabled={savingSecConfig}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg text-sm font-bold hover:from-red-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingSecConfig ? 'Saving...' : 'Save Config'}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 leading-relaxed">
                Accounts are <span className="font-semibold text-red-600">permanently locked</span> after reaching the limit and must be manually unlocked by admin.
              </p>
            </div>

            {/* Session Timeout */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Session Timeout</h4>
                  <p className="text-xs text-gray-500">Auto-logout timer</p>
                </div>
              </div>
              
              <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                <div className="text-center mb-3">
                  <div className="text-3xl font-bold text-orange-600">{sessionTimeout}</div>
                  <p className="text-xs text-gray-600 mt-1">minutes until logout</p>
                </div>
                
                {/* Input */}
                <div className="space-y-2 mb-3">
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={timeoutDraft}
                    onChange={(e) => setTimeoutDraft(Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg text-sm font-semibold text-center focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  />
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {[15, 30, 60, 120].map(val => (
                      <button
                        key={val}
                        onClick={() => setTimeoutDraft(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border-2 ${
                          timeoutDraft === val
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        {val}m
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveTimeout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg text-sm font-bold hover:from-orange-600 hover:to-amber-700 transition-all shadow-md"
                >
                  <Save className="w-4 h-4" />
                  Save Timeout
                </button>
              </div>
              
              <p className="text-xs text-gray-500 leading-relaxed">
                Session timeout is stored <span className="font-semibold">locally</span> and applies on next login. Range: 1–1440 minutes.
              </p>
            </div>

            {/* Locked Accounts */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Locked Accounts</h4>
                    <p className="text-xs text-gray-500">Failed login users</p>
                  </div>
                </div>
                <button
                  onClick={fetchLockedUsers}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold underline underline-offset-2"
                >
                  Refresh
                </button>
              </div>

              <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                {loadingLocked ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                    Loading...
                  </div>
                ) : lockedUsers.length === 0 ? (
                  <div className="py-12 text-center">
                    <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-700">No locked accounts</p>
                    <p className="text-xs text-gray-500 mt-1">All users have clean records</p>
                  </div>
                ) : (
                  <div className="max-h-[320px] overflow-y-auto">
                    <div className="divide-y divide-gray-200">
                      {lockedUsers.map(u => (
                        <div key={u._id} className="p-3 bg-white hover:bg-red-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center flex-shrink-0 shadow-md">
                              <span className="text-sm font-bold text-white">
                                {u.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-800 truncate">{u.name}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                <p className="text-xs text-red-600 font-semibold">
                                  {u.failedLoginAttempts} failed attempts
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnlockUser(u._id)}
                              disabled={unlockingId === u._id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-xs font-bold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm disabled:opacity-50 flex-shrink-0"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              {unlockingId === u._id ? '...' : 'Unlock'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
