/**
 * Dashboard Service
 * Provides data for role-specific dashboard cards with offline caching
 */

import { useAuthStore } from '@/lib/store/authStore';
import { checkInService } from './checkInService';
import { eventsService } from './eventsService';
import { 
  getActiveServices, 
  getMockEvents, 
  getLifeGroups, 
  getMockPathways,
  getFirstTimers,
  MockMember 
} from '@/data/mockData';
import type { User, UserRole } from '@/types/auth';

export interface DashboardStats {
  // Member stats
  nextEventName?: string;
  nextEventDate?: string;
  lastCheckInDate?: string;
  pathwayProgress?: number;
  pathwayName?: string;
  
  // Leader stats
  myGroupsCount?: number;
  nextGroupMeeting?: string;
  pendingVerifications?: number;
  
  // VIP stats
  newFirstTimersCount?: number;
  assignedFirstTimersCount?: number;
  
  // Admin stats
  todayCheckInsCount?: number;
  activeServicesCount?: number;
  upcomingEventsCount?: number;
  totalMembersCount?: number;
  
  // General
  isOnline: boolean;
  lastSync?: Date;
}

export interface DashboardCard {
  id: string;
  title: string;
  subtitle?: string;
  value?: string | number;
  icon: string;
  color: string;
  action?: string;
  navigateTo?: string;
  priority: number; // 1 = highest priority
  lastUpdated?: Date;
}

export class DashboardService {
  private static cachedStats: Map<string, { data: DashboardStats; timestamp: number }> = new Map();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get dashboard stats for user role
   */
  static async getDashboardStats(user: User): Promise<DashboardStats> {
    const cacheKey = `stats_${user.id}_${user.role}`;
    const cached = this.cachedStats.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      let stats: DashboardStats = {
        isOnline: navigator.onLine !== false,
        lastSync: new Date(),
      };

      // Get role-specific stats
      switch (user.role) {
        case 'MEMBER':
          stats = { ...stats, ...(await this.getMemberStats(user)) };
          break;
        case 'LEADER':
          stats = { ...stats, ...(await this.getLeaderStats(user)) };
          break;
        case 'VIP':
          stats = { ...stats, ...(await this.getVipStats(user)) };
          break;
        case 'ADMIN':
        case 'PASTOR':
        case 'SUPER_ADMIN':
          stats = { ...stats, ...(await this.getAdminStats(user)) };
          break;
      }

      // Cache the results
      this.cachedStats.set(cacheKey, {
        data: stats,
        timestamp: Date.now(),
      });

      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return cached data if available, otherwise minimal stats
      return cached?.data || {
        isOnline: false,
        lastSync: new Date(),
      };
    }
  }

  /**
   * Get member-specific stats
   */
  private static async getMemberStats(user: User): Promise<Partial<DashboardStats>> {
    const events = getMockEvents();
    const pathways = getMockPathways();
    
    // Find next event user is attending
    const upcomingEvents = events
      .filter(event => new Date(event.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const nextEvent = upcomingEvents[0];
    
    // Find user's active pathway
    const userPathway = pathways.find(p => p.members.includes(user.id));
    const pathwayProgress = userPathway ? 
      Math.round((userPathway.completedSteps / userPathway.totalSteps) * 100) : 0;

    return {
      nextEventName: nextEvent?.name,
      nextEventDate: nextEvent?.date,
      pathwayProgress,
      pathwayName: userPathway?.name,
    };
  }

  /**
   * Get leader-specific stats
   */
  private static async getLeaderStats(user: User): Promise<Partial<DashboardStats>> {
    const lifeGroups = getLifeGroups();
    const myGroups = lifeGroups.filter(group => group.leaderId === user.id);
    
    // Find next group meeting
    const nextMeeting = myGroups.find(group => {
      // Mock: assume groups meet weekly on the same day
      return group.members.length > 0;
    });

    return {
      myGroupsCount: myGroups.length,
      nextGroupMeeting: nextMeeting?.name || 'No upcoming meetings',
      pendingVerifications: Math.floor(Math.random() * 3), // Mock data
    };
  }

  /**
   * Get VIP-specific stats
   */
  private static async getVipStats(user: User): Promise<Partial<DashboardStats>> {
    const firstTimers = getFirstTimers();
    
    // Filter first-timers assigned to this VIP member
    const assignedToMe = firstTimers.filter(ft => ft.assignedVipId === user.id);
    const newThisWeek = firstTimers.filter(ft => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(ft.visitDate) > weekAgo;
    });

    return {
      newFirstTimersCount: newThisWeek.length,
      assignedFirstTimersCount: assignedToMe.length,
    };
  }

  /**
   * Get admin-specific stats
   */
  private static async getAdminStats(user: User): Promise<Partial<DashboardStats>> {
    const services = getActiveServices();
    const events = getMockEvents();
    
    // Today's services
    const today = new Date().toDateString();
    const todayServices = services.filter(service => 
      new Date(service.date).toDateString() === today
    );

    // Upcoming events (next 30 days)
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate > new Date() && eventDate <= thirtyDaysOut;
    });

    // Mock check-in count for today
    const mockCheckInsToday = Math.floor(Math.random() * 150) + 50;

    return {
      todayCheckInsCount: mockCheckInsToday,
      activeServicesCount: todayServices.length,
      upcomingEventsCount: upcomingEvents.length,
      totalMembersCount: 247, // Mock total
    };
  }

  /**
   * Get dashboard cards for user role
   */
  static async getDashboardCards(user: User): Promise<DashboardCard[]> {
    const stats = await this.getDashboardStats(user);
    const cards: DashboardCard[] = [];

    switch (user.role) {
      case 'MEMBER':
        if (stats.nextEventName) {
          cards.push({
            id: 'next-event',
            title: 'Next Event',
            subtitle: stats.nextEventName,
            value: stats.nextEventDate ? new Date(stats.nextEventDate).toLocaleDateString() : '',
            icon: 'calendar-heart',
            color: '#1e7ce8',
            action: 'View Details',
            navigateTo: 'Events',
            priority: 1,
          });
        }
        
        if (stats.lastCheckInDate) {
          cards.push({
            id: 'last-checkin',
            title: 'Last Check-In',
            value: new Date(stats.lastCheckInDate).toLocaleDateString(),
            icon: 'check-circle',
            color: '#22c55e',
            priority: 2,
          });
        }

        if (stats.pathwayProgress !== undefined && stats.pathwayName) {
          cards.push({
            id: 'pathway-progress',
            title: 'Pathway Progress',
            subtitle: stats.pathwayName,
            value: `${stats.pathwayProgress}%`,
            icon: 'map-marker-path',
            color: '#f59e0b',
            action: 'Continue',
            navigateTo: 'Pathways',
            priority: 1,
          });
        }
        break;

      case 'LEADER':
        if (stats.myGroupsCount !== undefined) {
          cards.push({
            id: 'my-groups',
            title: 'My Life Groups',
            value: stats.myGroupsCount,
            icon: 'account-group',
            color: '#8b5cf6',
            action: 'Manage',
            navigateTo: 'Groups',
            priority: 1,
          });
        }

        if (stats.nextGroupMeeting) {
          cards.push({
            id: 'next-meeting',
            title: 'Next Meeting',
            subtitle: stats.nextGroupMeeting,
            icon: 'calendar-clock',
            color: '#06b6d4',
            action: 'View Details',
            priority: 2,
          });
        }

        if (stats.pendingVerifications !== undefined && stats.pendingVerifications > 0) {
          cards.push({
            id: 'pending-verifications',
            title: 'Pending Verifications',
            value: stats.pendingVerifications,
            icon: 'account-check',
            color: '#f97316',
            action: 'Review',
            priority: 1,
          });
        }
        break;

      case 'VIP':
        if (stats.newFirstTimersCount !== undefined) {
          cards.push({
            id: 'new-first-timers',
            title: 'New First-Timers',
            subtitle: 'This week',
            value: stats.newFirstTimersCount,
            icon: 'account-plus',
            color: '#10b981',
            action: 'View List',
            navigateTo: 'VIP',
            priority: 1,
          });
        }

        if (stats.assignedFirstTimersCount !== undefined) {
          cards.push({
            id: 'my-assignments',
            title: 'My Assignments',
            value: stats.assignedFirstTimersCount,
            icon: 'account-heart',
            color: '#e11d48',
            action: 'Follow Up',
            navigateTo: 'VIP',
            priority: 2,
          });
        }
        break;

      case 'ADMIN':
      case 'PASTOR':
      case 'SUPER_ADMIN':
        if (stats.todayCheckInsCount !== undefined) {
          cards.push({
            id: 'today-checkins',
            title: 'Today\'s Check-ins',
            value: stats.todayCheckInsCount,
            icon: 'check-all',
            color: '#22c55e',
            action: 'View Details',
            priority: 1,
          });
        }

        if (stats.upcomingEventsCount !== undefined) {
          cards.push({
            id: 'upcoming-events',
            title: 'Upcoming Events',
            subtitle: 'Next 30 days',
            value: stats.upcomingEventsCount,
            icon: 'calendar-multiple',
            color: '#3b82f6',
            action: 'Manage',
            navigateTo: 'Events',
            priority: 2,
          });
        }

        if (stats.activeServicesCount !== undefined) {
          cards.push({
            id: 'active-services',
            title: 'Active Services',
            subtitle: 'Today',
            value: stats.activeServicesCount,
            icon: 'church',
            color: '#8b5cf6',
            action: 'Monitor',
            priority: 3,
          });
        }
        break;
    }

    // Add universal quick check-in card
    cards.push({
      id: 'quick-checkin',
      title: 'Quick Check-In',
      subtitle: 'Scan QR or search',
      icon: 'qrcode-scan',
      color: '#1e7ce8',
      action: 'Open Scanner',
      navigateTo: 'CheckIn',
      priority: 3,
    });

    // Sort by priority and return
    return cards.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Refresh dashboard data
   */
  static async refreshDashboard(user: User): Promise<void> {
    // Clear cached stats for user
    const cacheKey = `stats_${user.id}_${user.role}`;
    this.cachedStats.delete(cacheKey);
    
    // Refetch fresh data
    await this.getDashboardStats(user);
  }

  /**
   * Clear all cached dashboard data
   */
  static clearCache(): void {
    this.cachedStats.clear();
  }
}

export default DashboardService;