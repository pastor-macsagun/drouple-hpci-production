/**
 * useEvents Hook
 * React Query hooks for events data with offline support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  eventsService,
  EventsQueryParams,
  RSVPRequest,
} from '@/services/eventsService';
import { queryKeys } from '@/lib/api';
import { MockEvent, MockRSVP } from '@/data/mockData';
import { useOnlineSync } from './useOnlineSync';

/**
 * Get events list with optional filtering
 */
export const useEvents = (params?: EventsQueryParams) => {
  const { status: syncStatus } = useOnlineSync();

  return useQuery({
    queryKey: [...queryKeys.events.list, params],
    queryFn: () => eventsService.getEvents(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: syncStatus.isOnline,
    retry: (failureCount, error) => {
      // Don't retry if offline
      if (!syncStatus.isOnline) return false;
      return failureCount < 2;
    },
  });
};

/**
 * Get event details by ID
 */
export const useEventDetails = (eventId: string) => {
  const { status: syncStatus } = useOnlineSync();

  return useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => eventsService.getEventDetails(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: syncStatus.isOnline,
    retry: (failureCount, error) => {
      if (!syncStatus.isOnline) return false;
      return failureCount < 2;
    },
  });
};

/**
 * Get events with user RSVP status
 */
export const useEventsWithRSVP = (memberId: string) => {
  const { status: syncStatus } = useOnlineSync();

  return useQuery({
    queryKey: [...queryKeys.events.list, 'with-rsvp', memberId],
    queryFn: () => eventsService.getEventsWithRSVPStatus(memberId),
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 8 * 60 * 1000, // 8 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: syncStatus.isOnline,
    retry: (failureCount, error) => {
      if (!syncStatus.isOnline) return false;
      return failureCount < 2;
    },
  });
};

/**
 * Get user's RSVP status for a specific event
 */
export const useUserRSVPStatus = (eventId: string, memberId: string) => {
  return useQuery({
    queryKey: ['rsvp-status', eventId, memberId],
    queryFn: () => eventsService.getUserRSVPStatus(eventId, memberId),
    enabled: !!eventId && !!memberId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

/**
 * RSVP mutation with optimistic updates
 */
export const useRSVP = () => {
  const queryClient = useQueryClient();
  const { status: syncStatus } = useOnlineSync();

  return useMutation({
    mutationFn: (request: RSVPRequest) => eventsService.enqueueRSVP(request),
    onMutate: async (request: RSVPRequest) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: [...queryKeys.events.list],
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.events.detail(request.eventId),
      });
      await queryClient.cancelQueries({
        queryKey: ['rsvp-status', request.eventId, request.memberId],
      });

      // Snapshot previous values for rollback
      const previousEvents = queryClient.getQueryData([
        ...queryKeys.events.list,
      ]);
      const previousEventDetails = queryClient.getQueryData(
        queryKeys.events.detail(request.eventId)
      );
      const previousRSVPStatus = queryClient.getQueryData([
        'rsvp-status',
        request.eventId,
        request.memberId,
      ]);

      return {
        previousEvents,
        previousEventDetails,
        previousRSVPStatus,
        request,
      };
    },
    onSuccess: (result, request, context) => {
      if (result.success && result.data) {
        // Update event details with new data
        queryClient.setQueryData(
          queryKeys.events.detail(request.eventId),
          result.data.event
        );

        // Update RSVP status
        queryClient.setQueryData(
          ['rsvp-status', request.eventId, request.memberId],
          result.data.rsvp
        );

        // Update events list
        queryClient.setQueryData(
          [...queryKeys.events.list],
          (old: MockEvent[] | undefined) => {
            if (!old) return old;
            return old.map(event =>
              event.id === request.eventId ? result.data!.event : event
            );
          }
        );

        // Update events with RSVP
        queryClient.setQueryData(
          [...queryKeys.events.list, 'with-rsvp', request.memberId],
          (old: any) => {
            if (!old) return old;
            return old.map(
              (eventWithRSVP: MockEvent & { userRSVP?: MockRSVP }) =>
                eventWithRSVP.id === request.eventId
                  ? { ...result.data!.event, userRSVP: result.data!.rsvp }
                  : eventWithRSVP
            );
          }
        );
      }
    },
    onError: (error, request, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(
          [...queryKeys.events.list],
          context.previousEvents
        );
      }
      if (context?.previousEventDetails) {
        queryClient.setQueryData(
          queryKeys.events.detail(request.eventId),
          context.previousEventDetails
        );
      }
      if (context?.previousRSVPStatus) {
        queryClient.setQueryData(
          ['rsvp-status', request.eventId, request.memberId],
          context.previousRSVPStatus
        );
      }
    },
    onSettled: (data, error, request) => {
      // Always refetch to ensure consistency when online
      if (syncStatus.isOnline) {
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.events.list],
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.detail(request.eventId),
        });
        queryClient.invalidateQueries({
          queryKey: ['rsvp-status', request.eventId, request.memberId],
        });
      }
    },
  });
};

/**
 * Custom hook for refreshing events data (pull-to-refresh)
 */
export const useRefreshEvents = () => {
  const queryClient = useQueryClient();
  const { status: syncStatus } = useOnlineSync();

  const refreshEvents = useCallback(async (): Promise<void> => {
    try {
      // Check if data is stale
      const isStale = await eventsService.isDataStale();

      if (isStale || syncStatus.isOnline) {
        // Refresh events data
        await eventsService.refreshEvents();

        // Invalidate and refetch all events queries
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: queryKeys.events.list,
          }),
          queryClient.refetchQueries({
            queryKey: queryKeys.events.list,
          }),
        ]);
      }
    } catch (error) {
      console.error('Failed to refresh events:', error);
      throw error;
    }
  }, [queryClient, syncStatus.isOnline]);

  return {
    refreshEvents,
    isOnline: syncStatus.isOnline,
  };
};

/**
 * Get offline sync status for events
 */
export const useEventsSync = () => {
  const { status, syncNow } = useOnlineSync();
  const queryClient = useQueryClient();

  const syncEvents = useCallback(async () => {
    try {
      const result = await eventsService.syncRSVPs();

      // Refresh queries after successful sync
      if (result.succeeded > 0) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.events.list,
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to sync events:', error);
      throw error;
    }
  }, [queryClient]);

  return {
    syncStatus: status,
    syncEvents,
    syncAll: syncNow,
  };
};

/**
 * Check if events data is cached and available offline
 */
export const useOfflineEventsStatus = () => {
  const queryClient = useQueryClient();

  const checkOfflineData = useCallback(async () => {
    // Check if we have cached events data
    const cachedEvents = queryClient.getQueryData([...queryKeys.events.list]);
    const hasOfflineData = !!cachedEvents;

    // Get queue status
    const queuedRSVPs = await eventsService.getQueuedRSVPs();
    const queueCount = queuedRSVPs.length;

    return {
      hasOfflineData,
      queueCount,
      queuedRSVPs,
    };
  }, [queryClient]);

  return {
    checkOfflineData,
  };
};
