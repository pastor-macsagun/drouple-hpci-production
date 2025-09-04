/**
 * Check-in API Hooks
 * React Query hooks for check-in operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckinService } from '../../lib/api/services/checkin';
import { queryKeys, invalidateQueries, handleQueryError, optimisticUpdate } from '../../lib/api/react-query';
import { useAuthStore } from '../../lib/store/authStore';
import type { CheckInRequest } from '@drouple/contracts';

/**
 * Hook for services query
 */
export const useServices = () => {
  return useQuery({
    queryKey: queryKeys.checkin.services(),
    queryFn: CheckinService.getServices,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    onError: (error) => handleQueryError(error, queryKeys.checkin.services()),
  });
};

/**
 * Hook for check-in history query
 */
export const useCheckinHistory = () => {
  const user = useAuthStore(state => state.user);
  
  return useQuery({
    queryKey: queryKeys.checkin.history(user?.id),
    queryFn: CheckinService.getHistory,
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    onError: (error) => handleQueryError(error, queryKeys.checkin.history(user?.id)),
  });
};

/**
 * Hook for check-in mutation
 */
export const useCheckin = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  
  return useMutation({
    mutationKey: ['checkin', 'check-in'],
    mutationFn: (request: CheckInRequest) => CheckinService.checkIn(request),
    onMutate: async (newCheckin) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.checkin.history(user?.id) });
      
      // Snapshot previous value
      const previousHistory = queryClient.getQueryData(queryKeys.checkin.history(user?.id));
      
      // Optimistically add new check-in to history
      const optimisticCheckin = {
        id: 'temp-' + Date.now(),
        serviceName: 'Current Service', // This would be replaced with actual data
        serviceDate: new Date().toISOString(),
        checkedInAt: new Date().toISOString(),
        isNewBeliever: newCheckin.newBeliever || false,
      };
      
      optimisticUpdate.addToList(
        queryKeys.checkin.history(user?.id),
        optimisticCheckin
      );
      
      return { previousHistory };
    },
    onError: (error, newCheckin, context) => {
      // Revert optimistic update on error
      if (context?.previousHistory) {
        queryClient.setQueryData(
          queryKeys.checkin.history(user?.id),
          context.previousHistory
        );
      }
      console.error('Check-in mutation error:', error);
    },
    onSettled: () => {
      // Refetch check-in history and services
      invalidateQueries.checkin();
    },
  });
};

/**
 * Hook for quick check-in mutation
 */
export const useQuickCheckin = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  
  return useMutation({
    mutationKey: ['checkin', 'quick-check-in'],
    mutationFn: ({ newBeliever }: { newBeliever?: boolean }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      return CheckinService.quickCheckIn(user.id, newBeliever);
    },
    onSuccess: (result) => {
      // Invalidate related queries
      invalidateQueries.checkin();
      
      // Show success message (could be handled by UI component)
      console.log('Quick check-in successful:', result);
    },
    onError: (error) => {
      console.error('Quick check-in error:', error);
    },
  });
};

/**
 * Hook to check if user can check in today
 */
export const useCanCheckinToday = () => {
  const { data: history, isLoading } = useCheckinHistory();
  
  const canCheckinToday = !isLoading && history ? (() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Check if user already checked in today
    const checkedInToday = history.some(checkin => {
      const checkinDate = new Date(checkin.checkedInAt);
      const checkinDateStr = checkinDate.toISOString().split('T')[0];
      return checkinDateStr === todayStr;
    });
    
    return !checkedInToday;
  })() : true; // Allow check-in if history is not loaded yet
  
  return {
    canCheckin: canCheckinToday,
    isLoading,
    history,
  };
};

/**
 * Hook to get current service for check-in
 */
export const useCurrentService = () => {
  const { data: services, isLoading, error } = useServices();
  
  const currentService = services && services.length > 0 ? services[0] : null;
  
  return {
    service: currentService,
    isLoading,
    error,
    hasService: !!currentService,
  };
};

/**
 * Hook to get check-in statistics
 */
export const useCheckinStats = () => {
  const { data: history, isLoading } = useCheckinHistory();
  
  const stats = history ? {
    totalCheckins: history.length,
    thisMonth: history.filter(checkin => {
      const checkinDate = new Date(checkin.checkedInAt);
      const now = new Date();
      return checkinDate.getMonth() === now.getMonth() && 
             checkinDate.getFullYear() === now.getFullYear();
    }).length,
    thisYear: history.filter(checkin => {
      const checkinDate = new Date(checkin.checkedInAt);
      const now = new Date();
      return checkinDate.getFullYear() === now.getFullYear();
    }).length,
    streak: calculateStreak(history),
  } : null;
  
  return {
    stats,
    isLoading,
  };
};

// Helper function to calculate check-in streak
function calculateStreak(history: Array<{ checkedInAt: string }>): number {
  if (!history.length) return 0;
  
  // Sort by date descending
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()
  );
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const checkin of sortedHistory) {
    const checkinDate = new Date(checkin.checkedInAt);
    checkinDate.setHours(0, 0, 0, 0);
    
    // Check if this checkin is from today or yesterday
    const diffDays = (currentDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays === streak) {
      streak++;
    } else if (diffDays > streak) {
      break; // Streak is broken
    }
  }
  
  return streak;
}