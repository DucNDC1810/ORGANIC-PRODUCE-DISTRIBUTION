import { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, Eye, Search, Edit, Trash2, UserCheck, UserX, RefreshCw, ChevronLeft, ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { userAPI, User, UserStats, PaginationInfo } from '../Axios/Axios';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [newRole, setNewRole] = useState('');

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
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
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
      console.error('Failed to fetch stats:', error);
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
      setStatusDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await userAPI.deleteUser(selectedUser._id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      await userAPI.updateUser(selectedUser._id, editForm);
      setEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  // Handle change role
  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await userAPI.changeUserRole(selectedUser._id, newRole);
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Failed to change role:', error);
    }
  };

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
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
        <Button onClick={() => { fetchUsers(); fetchStats(); }} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setViewDialogOpen(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openRoleDialog(user)}>
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setStatusDialogOpen(true); }}>
                            {user.isActive ? <UserX className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }}>
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
              <Label className="text-sm font-medium">Email</Label>
              <Input 
                value={editForm.email} 
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                className="mt-1.5 bg-white"
                placeholder="Enter email address"
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
    </div>
  );
}
