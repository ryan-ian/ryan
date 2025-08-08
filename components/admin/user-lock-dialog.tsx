'use client';

import { useState } from 'react';
import { format, addHours, addDays } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Lock,
  Unlock,
  User,
  Loader2,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { lockUser, unlockUser, type User } from '@/lib/admin-data';
import { useAuth } from '@/contexts/auth-context';

interface UserLockDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserLockDialog({ user, open, onOpenChange, onSuccess }: UserLockDialogProps) {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockData, setLockData] = useState({
    locked_until: '',
    permanent: false,
    preset: '',
  });

  const isCurrentlyLocked = user?.status === 'locked';

  const presetOptions = [
    { value: '1_hour', label: '1 Hour', duration: () => addHours(new Date(), 1) },
    { value: '6_hours', label: '6 Hours', duration: () => addHours(new Date(), 6) },
    { value: '12_hours', label: '12 Hours', duration: () => addHours(new Date(), 12) },
    { value: '1_day', label: '1 Day', duration: () => addDays(new Date(), 1) },
    { value: '3_days', label: '3 Days', duration: () => addDays(new Date(), 3) },
    { value: '7_days', label: '7 Days', duration: () => addDays(new Date(), 7) },
    { value: 'permanent', label: 'Permanent', duration: null },
    { value: 'custom', label: 'Custom Date', duration: null },
  ];

  const handlePresetChange = (value: string) => {
    setLockData(prev => ({ ...prev, preset: value }));
    
    if (value === 'permanent') {
      setLockData(prev => ({ ...prev, permanent: true, locked_until: '' }));
    } else {
      const preset = presetOptions.find(p => p.value === value);
      if (preset && preset.duration) {
        const date = preset.duration();
        setLockData(prev => ({
          ...prev,
          permanent: false,
          locked_until: date.toISOString().slice(0, 16),
        }));
      } else if (value === 'custom') {
        setLockData(prev => ({ ...prev, permanent: false }));
      }
    }
  };

  const handleLock = async () => {
    if (!user || !currentUser?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const lockedUntil = lockData.permanent ? null : lockData.locked_until;
      
      if (!lockData.permanent && !lockData.locked_until) {
        setError('Please specify lock duration or select permanent lock');
        setIsLoading(false);
        return;
      }

      await lockUser(user.id, lockedUntil, currentUser.id);
      
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setLockData({
        locked_until: '',
        permanent: false,
        preset: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!user || !currentUser?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      await unlockUser(user.id, currentUser.id);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock user');
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
            {isCurrentlyLocked ? (
              <>
                <Unlock className="h-5 w-5 text-green-600" />
                Manage Account Lock
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-red-600" />
                Lock User Account
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCurrentlyLocked 
              ? 'Review and manage the current account lock for this user.'
              : 'Prevent user from accessing their account due to security concerns.'
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
              <div className="ml-auto flex items-center gap-2">
                <Badge 
                  className={
                    user.status === 'locked' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }
                >
                  {user.status === 'locked' ? 'Locked' : 'Active'}
                </Badge>
                {user.failed_login_attempts && user.failed_login_attempts > 0 && (
                  <Badge variant="outline" className="text-orange-600">
                    {user.failed_login_attempts} failed attempts
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {isCurrentlyLocked ? (
            /* Current Lock Details */
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-medium text-red-800 dark:text-red-400">Account Currently Locked</h4>
                {user.locked_until ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Locked until:</strong> {format(new Date(user.locked_until), 'PPp')}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Lock type:</strong> Permanent (manual unlock required)
                  </p>
                )}
                {user.failed_login_attempts && user.failed_login_attempts > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Failed login attempts:</strong> {user.failed_login_attempts}
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button 
                  onClick={handleUnlock} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Unlock className="h-4 w-4 mr-2" />
                  )}
                  Unlock Account
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
            /* Lock Form */
            <div className="space-y-4">
              <div>
                <Label htmlFor="preset">Lock Duration</Label>
                <Select value={lockData.preset} onValueChange={handlePresetChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lock duration" />
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

              {!lockData.permanent && lockData.preset === 'custom' && (
                <div>
                  <Label htmlFor="locked_until">Lock Until</Label>
                  <Input
                    id="locked_until"
                    type="datetime-local"
                    value={lockData.locked_until}
                    onChange={(e) => setLockData(prev => ({ ...prev, locked_until: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="permanent"
                  checked={lockData.permanent}
                  onCheckedChange={(checked) => setLockData(prev => ({ 
                    ...prev, 
                    permanent: checked,
                    locked_until: checked ? '' : prev.locked_until 
                  }))}
                />
                <Label htmlFor="permanent">Permanent lock (requires manual unlock)</Label>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-400 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium text-sm">Security Lock Effects</span>
                </div>
                <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                  <li>• User will be immediately logged out of all sessions</li>
                  <li>• User cannot log in until lock is removed</li>
                  <li>• Failed login attempts counter will be reset</li>
                  <li>• All active sessions will be terminated</li>
                  <li>• User will receive an email notification about the lock</li>
                </ul>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium text-sm">When to Use Account Lock</span>
                </div>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Suspected unauthorized access or security breach</li>
                  <li>• Multiple failed login attempts indicating brute force</li>
                  <li>• User reports account compromise</li>
                  <li>• Immediate security response required</li>
                </ul>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleLock} 
                  disabled={isLoading || (!lockData.permanent && !lockData.locked_until)}
                  variant="destructive"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Lock Account
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
