'use client';

import { useState } from 'react';
import { useUsers } from '@/hooks/use-users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  Plus,
  RefreshCcw,
  MoreHorizontal,
  Edit,
  Trash,
  Lock,
  CheckCircle,
  XCircle,
  Filter,
  Eye,
  AlertTriangle,
  Unlock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserForm } from '@/components/forms/user-form';
import { UserDetailsDialog } from '@/components/admin/user-details-dialog';
import { BulkUserActions } from '@/components/admin/bulk-user-actions';
import { UserStatusBadge, UserStatusIndicator } from '@/components/admin/user-status-badge';
import { UserSuspensionDialog } from '@/components/admin/user-suspension-dialog';
import { UserLockDialog } from '@/components/admin/user-lock-dialog';
import { UserManagementRoute } from '@/components/auth/protected-route';
import { useAuthorization } from '@/hooks/use-authorization';
import type { User } from '@/lib/admin-data';

export default function UserManagementPage() {
  const router = useRouter();
  const {
    canCreateUsers,
    canEditUser,
    canDeleteUser,
    canSuspendUser,
    canLockUser,
    canPerformBulkUserActions,
  } = useAuthorization();

  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isSuspensionDialogOpen, setIsSuspensionDialogOpen] = useState(false);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  const { 
    users, 
    totalCount, 
    isLoading, 
    error, 
    page, 
    pageSize, 
    searchQuery, 
    roleFilter,
    setPage, 
    setPageSize, 
    setSearchQuery, 
    setRoleFilter,
    fetchUsers,
    toggleUserActiveStatus,
  } = useUsers();
  
  // Calculate pagination values
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };
  
  const handleRoleFilterChange = (value: string) => {
    if (value === 'all') {
      setRoleFilter(undefined);
    } else {
      setRoleFilter(value as 'user' | 'facility_manager' | 'admin');
    }
  };
  
  const handleToggleUserStatus = async (user: User) => {
    try {
      await toggleUserActiveStatus(user.id, user.status === 'active' ? false : true);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map(user => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleBulkActionComplete = () => {
    fetchUsers();
    setSelectedUserIds([]);
  };

  const handleSuspendUser = (user: User) => {
    setSelectedUser(user);
    setIsSuspensionDialogOpen(true);
  };

  const handleLockUser = (user: User) => {
    setSelectedUser(user);
    setIsLockDialogOpen(true);
  };

  const handleSuspensionSuccess = () => {
    fetchUsers();
  };

  const handleLockSuccess = () => {
    fetchUsers();
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'facility_manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <Button 
            className="mt-4"
            onClick={() => fetchUsers()}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <UserManagementRoute>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts and permissions.
            </p>
          </div>

          {canCreateUsers() && (
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
          </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  {totalCount} total users
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search users..."
                      className="pl-8 w-full md:w-[200px] lg:w-[300px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="secondary">Search</Button>
                </form>

                <Select
                  value={roleFilter || 'all'}
                  onValueChange={handleRoleFilterChange}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Filter by role" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="facility_manager">Facility Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4">Loading users...</p>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10">
                <Users className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">No users found</p>
                <p className="text-muted-foreground">
                  {searchQuery || roleFilter ? 'Try adjusting your filters' : 'Add your first user to get started'}
                </p>
              </div>
            ) : (
              <>
                {canPerformBulkUserActions() && (
                  <BulkUserActions
                    selectedUserIds={selectedUserIds}
                    onActionComplete={handleBulkActionComplete}
                    onClearSelection={() => setSelectedUserIds([])}
                  />
                )}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.length === users.length && users.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(user.id)}
                              onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <button
                              onClick={() => router.push(`/admin/conference/users/${user.id}`)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                            >
                              {user.name}
                            </button>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <UserStatusBadge
                              status={user.status}
                              role={user.role}
                              showRole={true}
                              size="sm"
                            />
                          </TableCell>
                          <TableCell>{user.department || '-'}</TableCell>
                          <TableCell>
                            <UserStatusIndicator
                              status={user.status}
                              suspendedUntil={user.suspended_until}
                              lockedUntil={user.locked_until}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {canEditUser(user.id) && (
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {canEditUser(user.id) && (
                                  <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                                    {user.status === 'active' ? (
                                      <>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                                {canSuspendUser(user.id) && (
                                  <DropdownMenuItem onClick={() => handleSuspendUser(user)}>
                                    {user.status === 'suspended' ? (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Lift Suspension
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Suspend User
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                                {canLockUser(user.id) && (
                                  <DropdownMenuItem onClick={() => handleLockUser(user)}>
                                    {user.status === 'locked' ? (
                                      <>
                                        <Unlock className="h-4 w-4 mr-2" />
                                        Unlock Account
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Lock Account
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {users.length > 0 ? startItem : 0} to {endItem} of {totalCount} users
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </CardFooter>
        </Card>

        {/* Add User Dialog */}
        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. All fields marked with an asterisk (*) are required.
              </DialogDescription>
            </DialogHeader>

            <UserForm
              onSubmit={() => {
                setIsAddUserDialogOpen(false);
                fetchUsers();
              }}
              onCancel={() => setIsAddUserDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information. All fields marked with an asterisk (*) are required.
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <UserForm
                user={selectedUser}
                onSubmit={() => {
                  setIsEditDialogOpen(false);
                  fetchUsers();
                }}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <UserDetailsDialog
          userId={selectedUser?.id || null}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onEdit={(user) => {
            setSelectedUser(user);
            setIsDetailsDialogOpen(false);
            setIsEditDialogOpen(true);
          }}
        />

        {/* User Suspension Dialog */}
        <UserSuspensionDialog
          user={selectedUser}
          open={isSuspensionDialogOpen}
          onOpenChange={setIsSuspensionDialogOpen}
          onSuccess={handleSuspensionSuccess}
        />

        {/* User Lock Dialog */}
        <UserLockDialog
          user={selectedUser}
          open={isLockDialogOpen}
          onOpenChange={setIsLockDialogOpen}
          onSuccess={handleLockSuccess}
        />
      </div>
    </UserManagementRoute>
  );
}
