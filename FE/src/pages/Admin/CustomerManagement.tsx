import { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, Eye, Search, Edit, Trash2, UserCheck, UserX, RefreshCw, ChevronLeft, ChevronRight, Shield, AlertTriangle, Lock, UserPlus, EyeOff, Mail, User as UserIcon, Phone, MapPin, KeyRound, Briefcase, UserCog } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { userAPI, User, UserStats, PaginationInfo } from '../Axios/Axios';
import { toast } from 'sonner';

// Role badge colors
const roleBadgeColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-purple-100 text-purple-800',
  customer: 'bg-blue-100 text-blue-800',
  user: 'bg-gray-100 text-gray-800',
  shipper: 'bg-orange-100 text-orange-800',
  farmer: 'bg-green-100 text-green-800',
};

export default function CustomerManagement() {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({ 
    name: '', 
    email: '', 
    username: '',
    phone: '', 
    address: '' 
  });
  
  // Create form state
  const [createForm, setCreateForm] = useState<{
    name: string;
    email: string;
    username: string;
    password: string;
    role: 'admin' | 'manager' | 'customer' | 'user' | 'shipper' | 'farmer';
    phone: string;
    address: string;
  }>({ 
    name: '', 
    email: '', 
    username: '',
    password: '',
    role: 'customer',
    phone: '', 
    address: '' 
  });
  
  const [newRole, setNewRole] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers({
        page: currentPage,
        limit: 10,
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, roleFilter, statusFilter]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await userAPI.getUserStats();
      setStats(data);
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle toggle status
  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    try {
      await userAPI.toggleUserStatus(selectedUser._id);
      toast.success(`User ${selectedUser.isActive ? 'deactivated' : 'activated'} successfully!`);
      setStatusDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error('Failed to toggle user status');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await userAPI.deleteUser(selectedUser._id);
      toast.success('User deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      await userAPI.updateUser(selectedUser._id, editForm);
      toast.success('User information updated successfully!');
      setEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to update user information';
      toast.error(errorMessage);
    }
  };

  // Calculate password strength by length only (policy: min 6 chars)
  const calculatePasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: '', color: '' };
    if (password.length < 6) return { score: 2, text: 'Weak', color: 'bg-red-500' };
    if (password.length < 10) return { score: 4, text: 'Medium', color: 'bg-yellow-500' };
    return { score: 6, text: 'Strong', color: 'bg-green-500' };
  };

  // Handle create user
  const handleCreateUser = async () => {
    // Validate fields
    if (!createForm.name || !createForm.email || !createForm.username || !createForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate password
    const passwordValidationError = validatePassword(createForm.password);
    if (passwordValidationError) {
      toast.error(passwordValidationError);
      return;
    }

    try {
      await userAPI.createUser(createForm);
      toast.success('User created successfully!');
      setCreateDialogOpen(false);
      setCreateForm({ 
        name: '', 
        email: '', 
        username: '',
        password: '',
        role: 'customer',
        phone: '', 
        address: '' 
      });
      setPasswordStrength({ score: 0, text: '', color: '' });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to create user';
      toast.error(errorMessage);
    }
  };

  // Handle change role
  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await userAPI.changeUserRole(selectedUser._id, newRole);
      toast.success('User role updated successfully!');
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error('Failed to change user role');
    }
  };

  // Validate password with minimum length only
  const validatePassword = (password: string): string => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  // Handle reset password
  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (selectedUser.role !== 'admin') {
      const message = 'Admin chỉ được đổi mật khẩu cho tài khoản admin';
      setPasswordError(message);
      toast.error(message);
      return;
    }
    
    // Validate new password
    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      toast.error(passwordValidationError);
      return;
    }
    
    // Check if passwords match
    if (!confirmPassword) {
      setPasswordError('Please confirm your password');
      toast.error('Please confirm your password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      await userAPI.adminResetPassword(selectedUser._id, newPassword);
      toast.success(`Password reset successfully for ${selectedUser.name}!`);
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to reset password';
      toast.error(errorMessage);
      setPasswordError(errorMessage);
    }
  };

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone || '',
      address: user.address || ''
    });
    setEditDialogOpen(true);
  };

  // Open role dialog
  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  // Open password dialog
  const openPasswordDialog = (user: User) => {
    if (user.role !== 'admin') {
      toast.error('Không thể đổi mật khẩu cho tài khoản không phải admin');
      return;
    }

    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Account Management</h2>
          <p className="text-muted-foreground">Manage and monitor system users</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-primary hover:bg-primary-dark">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
          <Button onClick={() => { fetchUsers(); fetchStats(); }} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">{stats?.activeUsers || 0}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold text-foreground">{stats?.newUsersThisMonth || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unverified</p>
                <p className="text-2xl font-bold text-foreground">{stats?.unverifiedUsers || 0}</p>
              </div>
              <UserX className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>User List</CardTitle>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10 w-64" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="shipper">Shipper</SelectItem>
                  <SelectItem value="farmer">Farmer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{user.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge className={roleBadgeColors[user.role] || 'bg-gray-100 text-gray-800'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {!user.isEmailVerified && (
                            <Badge variant="outline" className="text-xs">Unverified</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setViewDialogOpen(true); }} title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)} title="Edit User">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPasswordDialog(user)}
                            title={user.role === 'admin' ? 'Reset Password Admin' : 'Chỉ hỗ trợ đổi mật khẩu cho Admin'}
                            disabled={user.role !== 'admin'}
                          >
                            <KeyRound className={`w-4 h-4 ${user.role === 'admin' ? 'text-orange-500' : 'text-gray-300'}`} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openRoleDialog(user)} title="Change Role">
                            <UserCog className="w-4 h-4 text-indigo-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setStatusDialogOpen(true); }} title="Toggle Status">
                            {user.isActive ? <UserX className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }} title="Delete User">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {users.length} of {pagination.totalUsers} users
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={!pagination.hasPrev}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={!pagination.hasNext}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-semibold mb-4 shadow-lg">
              {selectedUser?.name.charAt(0).toUpperCase()}
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-center">{selectedUser?.name}</DialogTitle>
              <DialogDescription className="text-center">@{selectedUser?.username}</DialogDescription>
            </DialogHeader>
          </div>
          {selectedUser && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-md p-3 shadow-sm">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                  <p className="font-medium text-sm mt-1 truncate">{selectedUser.email}</p>
                </div>
                <div className="bg-white rounded-md p-3 shadow-sm">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone</Label>
                  <p className="font-medium text-sm mt-1">{selectedUser.phone || '-'}</p>
                </div>
                <div className="bg-white rounded-md p-3 shadow-sm">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Role</Label>
                  <p className="mt-1"><Badge className={roleBadgeColors[selectedUser.role]}>{selectedUser.role}</Badge></p>
                </div>
                <div className="bg-white rounded-md p-3 shadow-sm">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                  <p className="mt-1"><Badge variant={selectedUser.isActive ? 'default' : 'destructive'}>{selectedUser.isActive ? 'Active' : 'Inactive'}</Badge></p>
                </div>
                <div className="bg-white rounded-md p-3 shadow-sm">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email Verified</Label>
                  <p className="mt-1"><Badge variant={selectedUser.isEmailVerified ? 'default' : 'outline'}>{selectedUser.isEmailVerified ? 'Verified' : 'Unverified'}</Badge></p>
                </div>
                <div className="bg-white rounded-md p-3 shadow-sm">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Created At</Label>
                  <p className="font-medium text-sm mt-1">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div className="col-span-2 bg-white rounded-md p-3 shadow-sm">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Address</Label>
                  <p className="font-medium text-sm mt-1">{selectedUser.address || '-'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Edit className="w-8 h-8 text-blue-600" />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-center">Edit User</DialogTitle>
              <DialogDescription className="text-center">Update information for <span className="font-semibold text-gray-900">{selectedUser?.name}</span></DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            <div>
              <Label className="text-sm font-medium">Full Name</Label>
              <Input 
                value={editForm.name} 
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                className="mt-1.5 bg-white"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Username</Label>
              <Input 
                value={editForm.username} 
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} 
                className="mt-1.5 bg-white"
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <Input 
                value={editForm.email} 
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                className="mt-1.5 bg-white"
                placeholder="Enter email address"
                type="email"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Phone</Label>
              <Input 
                value={editForm.phone} 
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                className="mt-1.5 bg-white"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Address</Label>
              <Input 
                value={editForm.address} 
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} 
                className="mt-1.5 bg-white"
                placeholder="Enter address"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleEdit} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog - Modern Design */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden">
          {/* Header with Gradient */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 opacity-10"></div>
            <div className="relative flex items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-gray-900">Create New User</DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">Add a new user account to the system</DialogDescription>
              </div>
            </div>
          </div>

          {/* Form Content with 2-column layout */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-green-600" />
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      value={createForm.name} 
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} 
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      placeholder="John Doe"
                      required
                    />
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-green-600" />
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      value={createForm.username} 
                      onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} 
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      placeholder="johndoe"
                      required
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      value={createForm.email} 
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} 
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      placeholder="john@example.com"
                      type="email"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Input 
                      value={createForm.phone} 
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} 
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      placeholder="+84 123 456 789"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Password */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-green-600" />
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      value={createForm.password} 
                      onChange={(e) => {
                        setCreateForm({ ...createForm, password: e.target.value });
                        setPasswordStrength(calculatePasswordStrength(e.target.value));
                      }} 
                      className="pl-10 pr-10 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      placeholder="Minimum 6 characters"
                      type={showCreatePassword ? 'text' : 'password'}
                      required
                    />
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password Strength Indicator */}
                  {createForm.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score <= 2 ? 'text-red-600' : 
                          passwordStrength.score <= 4 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
                    </div>
                  )}
                </div>

                {/* Role */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-green-600" />
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select value={createForm.role} onValueChange={(value) => setCreateForm({ ...createForm, role: value as 'admin' | 'manager' | 'customer' | 'user' | 'shipper' | 'farmer' })}>
                    <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          Customer
                        </div>
                      </SelectItem>
                      <SelectItem value="farmer">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Farmer
                        </div>
                      </SelectItem>
                      <SelectItem value="shipper">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          Shipper
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          Manager
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Address */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    Address
                  </Label>
                  <div className="relative">
                    <Input 
                      value={createForm.address} 
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} 
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all"
                      placeholder="City, Country"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Actions */}
          <DialogFooter className="border-t pt-4 mt-4">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCreateDialogOpen(false);
                  setCreateForm({ name: '', email: '', username: '', password: '', role: 'customer', phone: '', address: '' });
                  setPasswordStrength({ score: 0, text: '', color: '' });
                }} 
                className="flex-1 sm:flex-none border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser} 
                className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-center">Change Role</DialogTitle>
              <DialogDescription className="text-center">Update role for <span className="font-semibold text-gray-900">{selectedUser?.name}</span></DialogDescription>
            </DialogHeader>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <Label className="text-sm font-medium">Select New Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="mt-1.5 bg-white">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="shipper">Shipper</SelectItem>
                <SelectItem value="farmer">Farmer</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleChangeRole} className="flex-1 bg-purple-600 hover:bg-purple-700">
              <Shield className="w-4 h-4 mr-2" />
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-semibold text-center">Delete User</DialogTitle>
              <DialogDescription className="text-center text-gray-600">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{selectedUser?.name}"</span>?
                <br />
                <span className="text-red-600 text-sm">This action cannot be undone.</span>
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              selectedUser?.isActive ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {selectedUser?.isActive 
                ? <UserX className="w-8 h-8 text-red-600" />
                : <UserCheck className="w-8 h-8 text-green-600" />
              }
            </div>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-semibold text-center">
                {selectedUser?.isActive ? 'Deactivate User' : 'Activate User'}
              </DialogTitle>
              <DialogDescription className="text-center text-gray-600">
                {selectedUser?.isActive 
                  ? <>
                      Are you sure you want to deactivate <span className="font-semibold text-gray-900">"{selectedUser?.name}"</span>?
                      <br />
                      <span className="text-red-600 text-sm">They will no longer be able to access the system.</span>
                    </>
                  : <>
                      Are you sure you want to activate <span className="font-semibold text-gray-900">"{selectedUser?.name}"</span>?
                      <br />
                      <span className="text-green-600 text-sm">They will be able to access the system again.</span>
                    </>
                }
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => setStatusDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant={selectedUser?.isActive ? 'destructive' : 'default'}
              onClick={handleToggleStatus}
              className={`flex-1 ${selectedUser?.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {selectedUser?.isActive 
                ? <><UserX className="w-4 h-4 mr-2" /> Deactivate</>
                : <><UserCheck className="w-4 h-4 mr-2" /> Activate</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-center">Reset Password</DialogTitle>
              <DialogDescription className="text-center">
                Set a new password for <span className="font-semibold text-gray-900">{selectedUser?.name}</span>
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            {/* Password Requirements Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs font-semibold text-blue-800 mb-2">Password Requirements:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li className="flex items-center gap-1">
                  <span className={newPassword.length >= 6 ? 'text-green-600' : ''}>
                    • At least 6 characters
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <Label className="text-sm font-medium">New Password *</Label>
              <Input 
                type="password"
                value={newPassword} 
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError('');
                }} 
                className={`mt-1.5 bg-white ${passwordError && !confirmPassword ? 'border-red-300' : ''}`}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Confirm Password *</Label>
              <Input 
                type="password"
                value={confirmPassword} 
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError('');
                }} 
                className={`mt-1.5 bg-white ${passwordError && confirmPassword ? 'border-red-300' : ''}`}
                placeholder="Confirm new password"
                onPaste={(e) => {
                  e.preventDefault();
                  toast.error('Pasting is not allowed for password confirmation');
                }}
              />
              {/* Show match indicator */}
              {newPassword && confirmPassword && (
                <p className={`text-xs mt-1.5 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>
            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {passwordError}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setPasswordDialogOpen(false);
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError('');
              }} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword} 
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={!newPassword || !confirmPassword}
            >
              <Lock className="w-4 h-4 mr-2" />
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
