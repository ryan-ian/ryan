'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Building, MapPin, FileText, User as UserIcon } from 'lucide-react';

// Define form schema with Zod
const facilityFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  location: z.string().optional().refine(val => !val || val.length <= 200, {
    message: 'Location must be less than 200 characters',
  }),
  description: z.string().optional().refine(val => !val || val.length <= 500, {
    message: 'Description must be less than 500 characters',
  }),
  manager_id: z.string().optional(),
});

type FacilityFormValues = z.infer<typeof facilityFormSchema>;

interface FacilityFormProps {
  defaultValues?: {
    id?: string;
    name?: string;
    location?: string;
    description?: string;
    manager_id?: string;
  };
  availableManagers: User[];
  currentManagerId?: string | null;
  onSubmit: (values: FacilityFormValues) => void;
  isSubmitting?: boolean;
  isLoadingManagers?: boolean;
}

export function FacilityForm({
  defaultValues = {},
  availableManagers = [],
  currentManagerId,
  onSubmit,
  isSubmitting = false,
  isLoadingManagers = false,
}: FacilityFormProps) {
  // Initialize form with default values
  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      name: defaultValues.name || '',
      location: defaultValues.location || '',
      description: defaultValues.description || '',
      manager_id: defaultValues.manager_id || '',
    },
  });

  // Update form when default values change (e.g., when editing a different facility)
  useEffect(() => {
    form.reset({
      name: defaultValues.name || '',
      location: defaultValues.location || '',
      description: defaultValues.description || '',
      manager_id: defaultValues.manager_id || '',
    });
  }, [form, defaultValues]);

  // Prepare manager options
  const managerOptions = [...availableManagers];
  
  // If we're editing a facility and it already has a manager,
  // we need to include that manager in the options even if they're
  // not in the availableManagers list
  if (currentManagerId) {
    const currentManagerExists = managerOptions.some(
      (manager) => manager.id === currentManagerId
    );
    
    if (!currentManagerExists) {
      // Find the current manager in the default values
      const currentManager = defaultValues.manager_id 
        ? { id: defaultValues.manager_id, name: 'Current Manager' } as User 
        : null;
        
      if (currentManager) {
        managerOptions.unshift(currentManager);
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facility Name*</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Enter facility name" className="pl-8" {...field} />
                </div>
              </FormControl>
              <FormDescription>
                A unique name for the facility (e.g., "Main Building", "North Campus")
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Enter location" className="pl-8" {...field} />
                </div>
              </FormControl>
              <FormDescription>
                Physical address or location identifier (e.g., "123 Main St, Floor 3")
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <div className="relative">
                  <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    placeholder="Enter facility description"
                    className="resize-none pl-8 min-h-[100px]"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Additional details about the facility, its purpose, or special features
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="manager_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facility Manager</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
                disabled={isLoadingManagers}
              >
                <FormControl>
                  <SelectTrigger className="pl-8 relative">
                    <UserIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a facility manager" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingManagers ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2">Loading managers...</span>
                    </div>
                  ) : (
                    <>
                      <SelectItem value="">None (Unassigned)</SelectItem>
                      {managerOptions.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          No facility managers available. Create users with the Facility Manager role first.
                        </div>
                      ) : (
                        managerOptions.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name} {manager.email ? `(${manager.email})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                The person responsible for managing this facility. Only users with the Facility Manager role are listed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {defaultValues.id ? 'Update Facility' : 'Create Facility'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 