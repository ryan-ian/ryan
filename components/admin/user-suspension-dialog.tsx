'use client';

import { useState } from 'react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Loader2,
} from 'lucide-react';
import { suspendUser, unsuspendUser, type User } from '@/lib/admin-data';
import { useAuth } from '@/contexts/auth-context';

interface UserSuspensionDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserSuspensionDialog({ user, open, onOpenChange, onSuccess }: UserSuspensionDialogProps) {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suspensionData, setSuspensionData] = useState({
    suspended_until: '',
    reason: '',
    preset: '',
  });

  const isCurrentlySuspended = user?.status === 'suspended';

  const presetOptions = [
    { value: '1_day', label: '1 Day', duration: () => addDays(new Date(), 1) },
    { value: '3_days', label: '3 Days', duration: () => addDays(new Date(), 3) },
    { value: '1_week', label: '1 Week', duration: () => addWeeks(new Date(), 1) },
    { value: '2_weeks', label: '2 Weeks', duration: () => addWeeks(new Date(), 2) },
    { value: '1_month', label: '1 Month', duration: () => addMonths(new Date(), 1) },
    { value: '3_months', label: '3 Months', duration: () => addMonths(new Date(), 3) },
    { value: '6_months', label: '6 Months', duration: () => addMonths(new Date(), 6) },
    { value: 'custom', label: 'Custom Date', duration: null },
  ];

  const commonReasons = [
    'Violation of terms of service',
    'Inappropriate behavior',
    'Security concerns',
    'Policy violation',
    'Pending investigation',
    'Administrative action',
  ];

  const handlePresetChange = (value: string) => {
    setSuspensionData(prev => ({ ...prev, preset: value }));
    
    const preset = presetOptions.find(p => p.value === value);
    if (preset && preset.duration) {
      const date = preset.duration();
      setSuspensionData(prev => ({
        ...prev,
        suspended_until: date.toISOString().slice(0, 16),
      }));
    }
  };

  const handleSuspend = async () => {
    if (!user || !currentUser?.id) return;

    if (!suspensionData.suspended_until || !suspensionData.reason) {
      setError('Please provide both suspension date and reason');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await suspendUser(
        user.id,
        suspensionData.suspended_until,
        suspensionData.reason,
        currentUser.id
      );
      
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setSuspensionData({
        suspended_until: '',
        reason: '',
        preset: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!user || !currentUser?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      await unsuspendUser(user.id, currentUser.id);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsuspend user');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {isCurrentlySuspended ? 'Manage User Suspension' : 'Suspend User Account'}
          </DialogTitle>
          <DialogDescription>
            {isCurrentlySuspended 
              ? 'Review and manage the current suspension for this user account.'
              : 'Temporarily restrict access to this user account.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
              {error}
            </div>
          )}

          {/* User Information */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="ml-auto">
                <Badge 
                  className={
                    user.status === 'suspended' 
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }
                >
                  {user.status === 'suspended' ? 'Suspended' : 'Active'}
                </Badge>
              </div>
            </div>
          </div>

          {isCurrentlySuspended ? (
            /* Current Suspension Details */
            <div className="space-y-4">
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-medium text-orange-800 dark:text-orange-400">Current Suspension</h4>
                {user.suspension_reason && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Reason:</strong> {user.suspension_reason}
                  </p>
                )}
                {user.suspended_until && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Until:</strong> {format(new Date(user.suspended_until), 'PPp')}
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button 
                  onClick={handleUnsuspend} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Lift Suspension
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* Suspension Form */
            <div className="space-y-4">
              <div>
                <Label htmlFor="preset">Suspension Duration</Label>
                <Select value={suspensionData.preset} onValueChange={handlePresetChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration or choose custom" />
                  </SelectTrigger>
                  <SelectContent>
                    {presetOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                
                {/* Common Reasons */}
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Common reasons:</p>
                  <div className="flex flex-wrap gap-1">
                    {commonReasons.map((reason) => (
                      <Button
                        key={reason}
                        variant="outline"
                        size="sm"
                        className="text-xs h-6"
                        onClick={() => setSuspensionData(prev => ({ ...prev, reason }))}
                      >
                        {reason}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-400 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium text-sm">Suspension Effects</span>
                </div>
                <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                  <li>• User will be immediately logged out of all sessions</li>
                  <li>• User cannot log in until suspension is lifted</li>
                  <li>• All active bookings will remain but user cannot create new ones</li>
                  <li>• User will receive an email notification about the suspension</li>
                </ul>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSuspend} 
                  disabled={isLoading || !suspensionData.suspended_until || !suspensionData.reason}
                  variant="destructive"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Suspend User
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
