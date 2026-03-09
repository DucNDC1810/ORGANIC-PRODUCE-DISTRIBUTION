import { useState, useEffect, useRef } from 'react';
import { User, Phone, Mail, Home, Edit2, Save, X, Camera, Shield, Lock, Unlock, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../Axios/Axios';
import { toast } from 'sonner';
import api from '../../services/api';

// ─── Session timeout stored in localStorage ───────────────────────────────────
const SESSION_TIMEOUT_KEY = 'admin_session_timeout_minutes';
const DEFAULT_TIMEOUT = 30;

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
      toast.error('Session timeout must be between 1 and 1440 minutes');
      return;
    }
    localStorage.setItem(SESSION_TIMEOUT_KEY, String(timeoutDraft));
    setSessionTimeout(timeoutDraft);
    toast.success(`Session timeout set to ${timeoutDraft} minutes`);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your admin profile and personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Role Badge */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center gap-4">
            <div className="relative">
              <div
                onClick={handleAvatarClick}
                className={`relative ${isEditing ? 'cursor-pointer group' : ''}`}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                {formData.avatar || user?.avatar ? (
                  <img
                    src={formData.avatar || user?.avatar}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=10b981&color=fff&size=200`;
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-3xl font-bold text-white">{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                  </div>
                )}
                {isEditing && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                      <Edit2 className="w-4 h-4 text-white" />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{user?.name || 'Admin'}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-200">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700 capitalize">{user?.role || 'Admin'}</span>
            </div>
            {isEditing && (
              <p className="text-xs text-gray-400">
                <Camera className="w-3 h-3 inline mr-1" />
                Click avatar to change photo (max 2MB)
              </p>
            )}
          </div>
        </div>

        {/* Right: Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
              {!isEditing ? (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    placeholder="Enter your name"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <User className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800">{user?.name || 'Not set'}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <Mail className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800">{user?.email || 'Not set'}</span>
                </div>
                {isEditing && <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800">{user?.phone || 'Not set'}</span>
                  </div>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Gender</label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <User className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800">
                      {user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not set'}
                    </span>
                  </div>
                )}
              </div>

              {/* Date of Birth */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Date of Birth</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <User className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800">
                      {user?.dateOfBirth
                        ? new Date(user.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'Not set'}
                    </span>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Address</label>
                {isEditing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                    placeholder="Enter your address"
                    rows={3}
                  />
                ) : (
                  <div className="flex items-start gap-3 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <Home className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-gray-800">{user?.address || 'Not set'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      {/* Login Attempt Limits */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Login Attempt Limits</h3>
            <p className="text-xs text-gray-500">Configure failed-login lockout policy</p>
          </div>
          <span className="ml-auto text-xs text-gray-400">
            Current: <span className="font-semibold text-red-500">{maxAttempts}</span> attempts before lockout
          </span>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Account will be <span className="font-semibold text-red-600">permanently locked</span> after reaching the limit and must be <span className="font-semibold">manually unlocked by admin</span>.
          </p>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Max failed attempts before lockout</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={20}
                value={maxAttemptsDraft}
                onChange={(e) => setMaxAttemptsDraft(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
              />
              <span className="text-sm text-gray-500">attempts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[3, 5, 10].map(val => (
                <button
                  key={val}
                  onClick={() => setMaxAttemptsDraft(val)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    maxAttemptsDraft === val
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-red-300'
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">Range: 1–20. Locked accounts appear in "Locked Accounts" below.</p>
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end">
          <button
            onClick={handleSaveSecurityConfig}
            disabled={savingSecConfig}
            className="flex items-center gap-2 px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingSecConfig ? 'Saving...' : 'Save Security Config'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Timeout */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Session Timeout</h3>
              <p className="text-xs text-gray-500">Auto-logout after inactivity</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Current timeout: <span className="font-semibold text-orange-600">{sessionTimeout} minutes</span>
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={1440}
                value={timeoutDraft}
                onChange={(e) => setTimeoutDraft(Number(e.target.value))}
                className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              />
              <span className="text-sm text-gray-500">minutes</span>
              <button
                onClick={handleSaveTimeout}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[15, 30, 60, 120].map(val => (
                <button
                  key={val}
                  onClick={() => setTimeoutDraft(val)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    timeoutDraft === val
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {val}m
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">Range: 1–1440 minutes (24 hours). This setting is stored locally and applies on next login.</p>
          </div>
        </div>

        {/* Locked Users */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Locked Accounts</h3>
                <p className="text-xs text-gray-500">Users locked after failed logins</p>
              </div>
            </div>
            <button
              onClick={fetchLockedUsers}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2"
            >
              Refresh
            </button>
          </div>
          <div className="p-4">
            {loadingLocked ? (
              <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : lockedUsers.length === 0 ? (
              <div className="py-8 text-center">
                <Shield className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No locked accounts</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {lockedUsers.map(u => (
                  <div key={u._id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      <p className="text-xs text-red-500 mt-0.5">
                        {u.failedLoginAttempts} failed attempt(s)
                        {u.lockedUntil && (
                          <> · locked until {new Date(u.lockedUntil).toLocaleString('vi-VN')}</>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnlockUser(u._id)}
                      disabled={unlockingId === u._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      {unlockingId === u._id ? '...' : 'Unlock'}
                    </button>
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
