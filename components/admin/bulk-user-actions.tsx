'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  UserCheck,
  UserX,
  AlertTriangle,
  Trash2,
  Shield,
  Calendar,
  Loader2,
} from 'lucide-react';
import { performBulkUserOperation, type BulkUserOperation } from '@/lib/admin-data';
import { useAuth } from '@/contexts/auth-context';

interface BulkUserActionsProps {
  selectedUserIds: string[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

export function BulkUserActions({ selectedUserIds, onActionComplete, onClearSelection }: BulkUserActionsProps) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<BulkUserOperation['action'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for different actions
  const [suspensionData, setSuspensionData] = useState({
    suspended_until: '',
    reason: '',
  });
  const [roleChangeData, setRoleChangeData] = useState({
    role: '' as 'user' | 'facility_manager' | 'admin' | '',
  });

  const handleActionSelect = (action: BulkUserOperation['action']) => {
    setCurrentAction(action);
    setError(null);
    
    // For simple actions, execute immediately
    if (action === 'activate' || action === 'deactivate') {
      handleExecuteAction(action);
    } else {
      // For complex actions, open dialog
      setIsDialogOpen(true);
    }
  };

  const handleExecuteAction = async (action: BulkUserOperation['action'], parameters?: Record<string, any>) => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const operation: BulkUserOperation = {
        action,
        user_ids: selectedUserIds,
        parameters,
      };

      const result = await performBulkUserOperation(operation, user.id);

      if (result.failed.length > 0) {
        setError(`${result.failed.length} operations failed. Check console for details.`);
        console.error('Failed operations:', result.failed);
      }

      onActionComplete();
      onClearSelection();
      setIsDialogOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogSubmit = () => {
    if (!currentAction) return;

    let parameters: Record<string, any> | undefined;

    switch (currentAction) {
      case 'suspend':
        if (!suspensionData.suspended_until || !suspensionData.reason) {
          setError('Please provide both suspension date and reason');
          return;
        }
        parameters = suspensionData;
        break;
      
      case 'change_role':
        if (!roleChangeData.role) {
          setError('Please select a role');
          return;
        }
        parameters = { role: roleChangeData.role };
        break;
    }

    handleExecuteAction(currentAction, parameters);
  };

  const getActionTitle = () => {
    switch (currentAction) {
      case 'suspend':
        return 'Suspend Users';
      case 'delete':
        return 'Delete Users';
      case 'change_role':
        return 'Change User Roles';
      default:
        return 'Bulk Action';
    }
  };

  const getActionDescription = () => {
    switch (currentAction) {
      case 'suspend':
        return `Suspend ${selectedUserIds.length} selected user(s). They will not be able to access the system until the suspension is lifted.`;
      case 'delete':
        return `Permanently delete ${selectedUserIds.length} selected user(s). This action cannot be undone.`;
      case 'change_role':
        return `Change the role for ${selectedUserIds.length} selected user(s).`;
      default:
        return '';
    }
  };

  if (selectedUserIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
          {selectedUserIds.length} selected
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              Bulk Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleActionSelect('activate')}>
              <UserCheck className="h-4 w-4 mr-2 text-green-600" />
              Activate Users
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleActionSelect('deactivate')}>
              <UserX className="h-4 w-4 mr-2 text-orange-600" />
              Deactivate Users
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleActionSelect('suspend')}>
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              Suspend Users
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleActionSelect('change_role')}>
              <Shield className="h-4 w-4 mr-2 text-blue-600" />
              Change Role
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleActionSelect('delete')}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Users
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear Selection
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{getActionTitle()}</DialogTitle>
            <DialogDescription>{getActionDescription()}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
                {error}
              </div>
            )}

            {currentAction === 'suspend' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="suspended_until">Suspend Until</Label>
                  <Input
                    id="suspended_until"
                    type="datetime-local"
                    value={suspensionData.suspended_until}
                    onChange={(e) => setSuspensionData(prev => ({ ...prev, suspended_until: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason for Suspension</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter the reason for suspension..."
                    value={suspensionData.reason}
                    onChange={(e) => setSuspensionData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {currentAction === 'change_role' && (
              <div>
                <Label htmlFor="role">New Role</Label>
                <Select
                  value={roleChangeData.role}
                  onValueChange={(value) => setRoleChangeData({ role: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="facility_manager">Facility Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentAction === 'delete' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-400 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Warning</span>
                </div>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  This action will permanently delete the selected users and cannot be undone. 
                  All associated data will be removed from the system.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleDialogSubmit} 
              disabled={isLoading}
              variant={currentAction === 'delete' ? 'destructive' : 'default'}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {currentAction === 'delete' ? 'Delete Users' : 'Apply Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
