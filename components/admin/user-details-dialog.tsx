'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Shield,
  Activity,
  AlertTriangle,
  Lock,
  Unlock,
  UserX,
  UserCheck,
  Edit,
} from 'lucide-react';
import { getUserById, getUserAuditLogs, type User as UserType, type UserAuditLog } from '@/lib/admin-data';

interface UserDetailsDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (user: UserType) => void;
}

export function UserDetailsDialog({ userId, open, onOpenChange, onEdit }: UserDetailsDialogProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchUserDetails();
    }
  }, [userId, open]);

  const fetchUserDetails = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const [userData, logsData] = await Promise.all([
        getUserById(userId),
        getUserAuditLogs(userId, 20)
      ]);
      
      setUser(userData);
      setAuditLogs(logsData);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">Inactive</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Suspended</Badge>;
      case 'locked':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Locked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Admin</Badge>;
      case 'facility_manager':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Facility Manager</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">User</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'deleted':
        return <UserX className="h-4 w-4 text-red-600" />;
      case 'activated':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'deactivated':
        return <UserX className="h-4 w-4 text-orange-600" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'locked':
        return <Lock className="h-4 w-4 text-red-600" />;
      case 'unlocked':
        return <Unlock className="h-4 w-4 text-green-600" />;
      case 'role_changed':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'password_reset':
        return <Lock className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!user && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Comprehensive view of user information and activity history
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : user ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Name:</span>
                      <span>{user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{user.organization || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Position:</span>
                      <span>{user.position || 'Not specified'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Account Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      {getStatusBadge(user.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Role:</span>
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Created: {format(new Date(user.date_created), 'PPP')}</span>
                    </div>
                    {user.last_login && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Last login: {format(new Date(user.last_login), 'PPp')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {user.status === 'suspended' && (
                <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-orange-800 dark:text-orange-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Suspension Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.suspension_reason && (
                      <p className="text-orange-700 dark:text-orange-300 mb-2">
                        <strong>Reason:</strong> {user.suspension_reason}
                      </p>
                    )}
                    {user.suspended_until && (
                      <p className="text-orange-700 dark:text-orange-300">
                        <strong>Until:</strong> {format(new Date(user.suspended_until), 'PPp')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button onClick={() => onEdit?.(user)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>Recent actions performed on this user account</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {auditLogs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No activity logs found</p>
                    ) : (
                      <div className="space-y-3">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border">
                            {getActionIcon(log.action)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium capitalize">{log.action.replace('_', ' ')}</span>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(log.performed_at), 'PPp')}
                                </span>
                              </div>
                              {log.details && Object.keys(log.details).length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  {JSON.stringify(log.details, null, 2)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Information</CardTitle>
                  <CardDescription>Account security status and settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Failed Login Attempts:</span>
                      <span className="ml-2">{user.failed_login_attempts || 0}</span>
                    </div>
                    {user.locked_until && (
                      <div>
                        <span className="font-medium">Locked Until:</span>
                        <span className="ml-2">{format(new Date(user.locked_until), 'PPp')}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Account Actions</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Reset Password
                      </Button>
                      <Button variant="outline" size="sm">
                        Force Logout
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">User not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
