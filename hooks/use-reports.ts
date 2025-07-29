import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface ReportParams {
  startDate?: string;
  endDate?: string;
  facilityId?: string;
  interval?: 'day' | 'week' | 'month';
  [key: string]: any;
}

interface UseReportsOptions {
  reportType: 'room-utilization' | 'booking-trends' | 'department-usage';
  initialParams?: ReportParams;
}

interface UseReportsResult {
  data: any[];
  isLoading: boolean;
  error: string | null;
  params: ReportParams;
  setParams: (params: ReportParams) => void;
  fetchReport: () => Promise<void>;
  exportAsCsv: () => Promise<string | null>;
}

export function useReports({
  reportType,
  initialParams = {},
}: UseReportsOptions): UseReportsResult {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<ReportParams>(initialParams);

  // Default date range (last 30 days)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  // Ensure we have default dates if not provided
  const ensureDefaultParams = (currentParams: ReportParams) => {
    const { startDate, endDate } = currentParams;
    
    if (!startDate || !endDate) {
      const defaultDates = getDefaultDateRange();
      return {
        ...currentParams,
        startDate: startDate || defaultDates.startDate,
        endDate: endDate || defaultDates.endDate,
      };
    }
    
    return currentParams;
  };

  // Fetch report data
  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const paramsWithDefaults = ensureDefaultParams(params);
      
      const response = await apiClient.getReportData(reportType, paramsWithDefaults);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        setData(Array.isArray(response.data) ? response.data : []);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(`Error fetching ${reportType} report:`, err);
      setError('Failed to load report data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [reportType, params]);

  // Export report as CSV
  const exportAsCsv = useCallback(async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const paramsWithDefaults = ensureDefaultParams(params);
      
      const response = await apiClient.exportReportAsCsv(reportType, paramsWithDefaults);
      
      if (response.error) {
        setError(response.error);
        return null;
      }
      
      return response.data;
    } catch (err) {
      console.error(`Error exporting ${reportType} report:`, err);
      setError('Failed to export report. Please try again later.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [reportType, params]);

  return {
    data,
    isLoading,
    error,
    params,
    setParams,
    fetchReport,
    exportAsCsv,
  };
} 