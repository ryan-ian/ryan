import { useState, useCallback, useEffect } from 'react';
import { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  setUserActiveStatus,
  updateUserPassword,
  type User,
  type UserFormData
} from '@/lib/admin-data';

interface UseUsersOptions {
  initialPage?: number;
  initialPageSize?: number;
  initialSearchQuery?: string;
  initialRoleFilter?: 'user' | 'facility_manager' | 'admin';
}

interface UseUsersResult {
  users: User[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  searchQuery: string;
  roleFilter?: 'user' | 'facility_manager' | 'admin';
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearchQuery: (query: string) => void;
  setRoleFilter: (role?: 'user' | 'facility_manager' | 'admin') => void;
  fetchUsers: () => Promise<void>;
  fetchUserById: (userId: string) => Promise<User | null>;
  createNewUser: (userData: UserFormData) => Promise<User>;
  updateExistingUser: (userId: string, userData: Partial<UserFormData>) => Promise<User>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<void>;
  toggleUserActiveStatus: (userId: string, isActive: boolean) => Promise<User>;
}

export function useUsers({
  initialPage = 1,
  initialPageSize = 10,
  initialSearchQuery = '',
  initialRoleFilter,
}: UseUsersOptions = {}): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [roleFilter, setRoleFilter] = useState<'user' | 'facility_manager' | 'admin' | undefined>(initialRoleFilter);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await getUsers(page, pageSize, searchQuery, roleFilter);
      
      setUsers(result.users);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchQuery, roleFilter]);

  const fetchUserById = useCallback(async (userId: string): Promise<User | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const user = await getUserById(userId);
      return user;
    } catch (err) {
      console.error(`Error fetching user ${userId}:`, err);
      setError(`Failed to load user. Please try again later.`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewUser = useCallback(async (userData: UserFormData): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newUser = await createUser(userData);
      
      // Refresh user list if we're on the first page
      if (page === 1) {
        fetchUsers();
      }
      
      return newUser;
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user. Please try again later.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [page, fetchUsers]);

  const updateExistingUser = useCallback(async (userId: string, userData: Partial<UserFormData>): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await updateUser(userId, userData);
      
      // Update the user in the current list if it exists
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, ...updatedUser } : user
        )
      );
      
      return updatedUser;
    } catch (err) {
      console.error(`Error updating user ${userId}:`, err);
      setError('Failed to update user. Please try again later.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changeUserPassword = useCallback(async (userId: string, newPassword: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await updateUserPassword(userId, newPassword);
    } catch (err) {
      console.error(`Error updating password for user ${userId}:`, err);
      setError('Failed to update password. Please try again later.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleUserActiveStatus = useCallback(async (userId: string, isActive: boolean): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await setUserActiveStatus(userId, isActive);
      
      // Update the user in the current list if it exists
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: isActive ? 'active' : 'inactive' } : user
        )
      );
      
      return updatedUser;
    } catch (err) {
      console.error(`Error toggling active status for user ${userId}:`, err);
      setError('Failed to update user status. Please try again later.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
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
    fetchUserById,
    createNewUser,
    updateExistingUser,
    changeUserPassword,
    toggleUserActiveStatus,
  };
} 