import { useState, useEffect } from 'react';
import { getSystemStats, getRecentActivity, getBookingTrends, getUserGrowth } from '@/lib/admin-data';
import type { SystemStats, ActivityItem, BookingTrend, UserGrowth } from '@/lib/admin-data';

interface AdminStatsResult {
  stats: SystemStats;
  activities: ActivityItem[];
  bookingTrends: BookingTrend[];
  userGrowth: UserGrowth[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminStats(): AdminStatsResult {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalFacilities: 0,
    activeBookings: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [bookingTrends, setBookingTrends] = useState<BookingTrend[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [statsData, activitiesData, bookingTrendsData, userGrowthData] = await Promise.all([
        getSystemStats(),
        getRecentActivity(5), // Limit to 5 most recent activities
        getBookingTrends('month', 12), // Last 12 months
        getUserGrowth('month', 12), // Last 12 months
      ]);
      
      setStats(statsData);
      setActivities(activitiesData);
      setBookingTrends(bookingTrendsData);
      setUserGrowth(userGrowthData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    stats,
    activities,
    bookingTrends,
    userGrowth,
    isLoading,
    error,
    refetch: fetchData,
  };
} 