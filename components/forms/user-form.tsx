'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { createUser, updateUser, type User, type UserFormData } from '@/lib/admin-data';
import { Loader2 } from 'lucide-react';

// Define form schema with Zod
const userFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  role: z.enum(['user', 'facility_manager', 'admin'], {
    required_error: 'Please select a role.',
  }),
  status: z.enum(['active', 'inactive', 'suspended', 'locked'], {
    required_error: 'Please select a status.',
  }),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }).optional(),
  confirmPassword: z.string().optional(),
  suspensionReason: z.string().optional(),
  suspendedUntil: z.string().optional(),
}).refine((data) => {
  // If password is provided, confirmPassword must match
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // If status is suspended, suspension details are required
  if (data.status === 'suspended') {
    return data.suspensionReason && data.suspendedUntil;
  }
  return true;
}, {
  message: "Suspension reason and end date are required for suspended users",
  path: ["suspensionReason"],
});

type UserFormProps = {
  user?: User;
  onSubmit: () => void;
  onCancel: () => void;
};

export function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!user;
  
  // Initialize form with default values or user data
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'user',
      status: user?.status || 'active',
      department: user?.department || '',
      position: user?.position || '',
      phone: user?.phone || '',
      password: '',
      confirmPassword: '',
      suspensionReason: user?.suspension_reason || '',
      suspendedUntil: user?.suspended_until ? user.suspended_until.slice(0, 16) : '',
    },
  });
  
  const handleFormSubmit = async (values: z.infer<typeof userFormSchema>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const userData: UserFormData = {
        name: values.name,
        email: values.email,
        role: values.role,
        status: values.status,
        department: values.department || undefined,
        position: values.position || undefined,
        phone: values.phone || undefined,
      };

      // Add password only if provided (required for new users)
      if (values.password) {
        userData.password = values.password;
      }

      // Add suspension data if status is suspended
      if (values.status === 'suspended') {
        userData.suspension_reason = values.suspensionReason;
        userData.suspended_until = values.suspendedUntil;
      }
      
      if (isEditMode && user) {
        await updateUser(user.id, userData);
      } else {
        await createUser(userData);
      }
      
      onSubmit();
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the user.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="user@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="facility_manager">Facility Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Determines what permissions the user will have.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Controls user access to the system.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Engineering" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input placeholder="Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Suspension fields - only show when status is suspended */}
        {form.watch('status') === 'suspended' && (
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium mb-3 text-orange-700 dark:text-orange-400">
              Suspension Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="suspendedUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suspended Until *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </FormControl>
                    <FormDescription>
                      Date and time when the suspension will be lifted.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="suspensionReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suspension Reason *</FormLabel>
                    <FormControl>
                      <Input placeholder="Reason for suspension..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Explain why the user is being suspended.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        
        {/* Password fields - required for new users, optional for edits */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium mb-3">
            {isEditMode ? 'Change Password (Optional)' : 'Set Password *'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditMode ? 'New Password' : 'Password *'}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  {isEditMode && (
                    <FormDescription>
                      Leave blank to keep current password.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditMode ? 'Confirm New Password' : 'Confirm Password *'}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 