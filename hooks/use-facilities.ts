import { useState, useCallback, useEffect } from 'react';
import { 
  apiClient, 
  type Facility, 
  type FacilityCreateRequest, 
  type FacilityUpdateRequest, 
  type User,
  type PaginationParams,
  type FilterParams
} from '@/lib/api-client';

interface UseFacilitiesOptions {
  initialPage?: number;
  initialPageSize?: number;
  initialSearchQuery?: string;
  initialSortField?: string;
  initialSortOrder?: 'asc' | 'desc';
}

interface UseFacilitiesResult {
  facilities: Facility[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  searchQuery: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearchQuery: (query: string) => void;
  setSortField: (field: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  fetchFacilities: () => Promise<void>;
  getFacilityById: (id: string) => Promise<Facility | null>;
  createFacility: (facilityData: FacilityCreateRequest) => Promise<Facility | null>;
  updateFacility: (id: string, facilityData: FacilityUpdateRequest) => Promise<Facility | null>;
  deleteFacility: (id: string) => Promise<boolean>;
  checkFacilityDependencies: (id: string) => Promise<{ rooms: number, resources: number } | null>;
  availableManagers: User[];
  fetchAvailableManagers: (facilityId?: string) => Promise<void>;
  isLoadingManagers: boolean;
}

export function useFacilities({
  initialPage = 1,
  initialPageSize = 10,
  initialSearchQuery = '',
  initialSortField = 'name',
  initialSortOrder = 'asc',
}: UseFacilitiesOptions = {}): UseFacilitiesResult {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortField, setSortField] = useState<string>(initialSortField);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  
  const [availableManagers, setAvailableManagers] = useState<User[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);

  const fetchFacilities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: PaginationParams & FilterParams = {
        page,
        pageSize,
        search: searchQuery,
        sortBy: sortField,
        sortOrder: sortOrder
      };
      
      const response = await apiClient.getFacilities(params);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        setFacilities(response.data.facilities);
        setTotalCount(response.data.total);
      }
    } catch (err) {
      console.error('Error fetching facilities:', err);
      setError('Failed to load facilities. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchQuery, sortField, sortOrder]);

  const getFacilityById = useCallback(async (id: string): Promise<Facility | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.getFacilityById(id);
      
      if (response.error) {
        setError(response.error);
        return null;
      }
      
      return response.data;
    } catch (err) {
      console.error(`Error fetching facility ${id}:`, err);
      setError('Failed to load facility details. Please try again later.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createFacility = useCallback(async (facilityData: FacilityCreateRequest): Promise<Facility | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.createFacility(facilityData);
      
      if (response.error) {
        setError(response.error);
        return null;
      }
      
      // Refresh facility list if we're on the first page
      if (page === 1) {
        fetchFacilities();
      }
      
      return response.data;
    } catch (err) {
      console.error('Error creating facility:', err);
      setError('Failed to create facility. Please try again later.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [page, fetchFacilities]);

  const updateFacility = useCallback(async (id: string, facilityData: FacilityUpdateRequest): Promise<Facility | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.updateFacility(id, facilityData);
      
      if (response.error) {
        setError(response.error);
        return null;
      }
      
      // Update the facility in the current list if it exists
      setFacilities(prevFacilities => 
        prevFacilities.map(facility => 
          facility.id === id ? { ...facility, ...response.data } as Facility : facility
        )
      );
      
      return response.data;
    } catch (err) {
      console.error(`Error updating facility ${id}:`, err);
      setError('Failed to update facility. Please try again later.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteFacility = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.deleteFacility(id);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Remove the facility from the current list
      setFacilities(prevFacilities => 
        prevFacilities.filter(facility => facility.id !== id)
      );
      
      // Update total count
      setTotalCount(prevCount => Math.max(0, prevCount - 1));
      
      // If we've deleted the last item on a page (except for the first page),
      // go back one page
      if (facilities.length === 1 && page > 1) {
        setPage(page - 1);
      }
      
      return true;
    } catch (err) {
      console.error(`Error deleting facility ${id}:`, err);
      setError('Failed to delete facility. Please try again later.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [facilities.length, page]);

  const checkFacilityDependencies = useCallback(async (id: string): Promise<{ rooms: number, resources: number } | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.checkFacilityDependencies(id);
      
      if (response.error) {
        setError(response.error);
        return null;
      }
      
      return response.data;
    } catch (err) {
      console.error(`Error checking facility dependencies for ${id}:`, err);
      setError('Failed to check facility dependencies. Please try again later.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAvailableManagers = useCallback(async (facilityId?: string) => {
    try {
      setIsLoadingManagers(true);
      
      const response = await apiClient.getAvailableFacilityManagers(facilityId);
      
      if (response.error) {
        console.error('Error fetching available managers:', response.error);
        return;
      }
      
      if (response.data) {
        setAvailableManagers(response.data);
      }
    } catch (err) {
      console.error('Error fetching available managers:', err);
    } finally {
      setIsLoadingManagers(false);
    }
  }, []);

  // Reset to first page when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Initial fetch
  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  return {
    facilities,
    totalCount,
    isLoading,
    error,
    page,
    pageSize,
    searchQuery,
    sortField,
    sortOrder,
    setPage,
    setPageSize,
    setSearchQuery,
    setSortField,
    setSortOrder,
    fetchFacilities,
    getFacilityById,
    createFacility,
    updateFacility,
    deleteFacility,
    checkFacilityDependencies,
    availableManagers,
    fetchAvailableManagers,
    isLoadingManagers,
  };
} 