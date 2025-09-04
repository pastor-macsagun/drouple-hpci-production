/**
 * Mock Events Data
 * Sample church events for testing Events & RSVP functionality
 */

import type { EventDTO } from '@drouple/contracts';

export interface MockEvent extends EventDTO {
  description: string;
  imageUrl?: string;
  rsvpDeadline?: string;
  currentAttendees: number;
  waitlistCount: number;
  userRSVPStatus: 'none' | 'confirmed' | 'waitlisted' | 'cancelled';
  requiresApproval: boolean;
  tags: string[];
}

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: 'event-1',
    title: 'Sunday Worship Service',
    startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    location: 'Main Sanctuary',
    capacity: 300,
    spotsLeft: 45,
    description:
      'Join us for our weekly worship service with inspiring music, prayer, and a powerful message from Pastor John.',
    imageUrl: 'https://example.com/worship.jpg',
    rsvpDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    currentAttendees: 255,
    waitlistCount: 0,
    userRSVPStatus: 'none',
    requiresApproval: false,
    tags: ['Worship', 'Weekly', 'All Ages'],
  },
  {
    id: 'event-2',
    title: 'Youth Night - Game Tournament',
    startsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    location: 'Youth Hall',
    capacity: 50,
    spotsLeft: 0, // Full event
    description:
      'Epic game tournament night for our youth! Pizza, games, and great fellowship. Ages 13-18 welcome.',
    imageUrl: 'https://example.com/youth.jpg',
    rsvpDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    currentAttendees: 50,
    waitlistCount: 8,
    userRSVPStatus: 'waitlisted',
    requiresApproval: true,
    tags: ['Youth', 'Games', 'Fellowship'],
  },
  {
    id: 'event-3',
    title: 'Community Outreach - Food Drive',
    startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    location: 'Church Parking Lot',
    capacity: 25,
    spotsLeft: 12,
    description:
      "Help serve our community by volunteering for our monthly food drive. We'll be collecting and distributing food to local families in need.",
    imageUrl: 'https://example.com/outreach.jpg',
    rsvpDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    currentAttendees: 13,
    waitlistCount: 0,
    userRSVPStatus: 'confirmed',
    requiresApproval: false,
    tags: ['Outreach', 'Service', 'Community'],
  },
  {
    id: 'event-4',
    title: "Women's Bible Study Retreat",
    startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
    location: 'Mountain View Retreat Center',
    capacity: 40,
    spotsLeft: 18,
    description:
      "A weekend retreat focused on spiritual growth, fellowship, and studying God's word together. Includes meals and accommodation.",
    imageUrl: 'https://example.com/retreat.jpg',
    rsvpDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    currentAttendees: 22,
    waitlistCount: 0,
    userRSVPStatus: 'none',
    requiresApproval: true,
    tags: ['Women', 'Retreat', 'Bible Study'],
  },
  {
    id: 'event-5',
    title: "Men's Prayer Breakfast",
    startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    location: 'Fellowship Hall',
    capacity: 60,
    spotsLeft: 35,
    description:
      'Start your Saturday with prayer, fellowship, and a hearty breakfast with fellow men of faith.',
    imageUrl: 'https://example.com/breakfast.jpg',
    rsvpDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    currentAttendees: 25,
    waitlistCount: 0,
    userRSVPStatus: 'confirmed',
    requiresApproval: false,
    tags: ['Men', 'Prayer', 'Fellowship'],
  },
  {
    id: 'event-6',
    title: 'Christmas Concert Rehearsal',
    startsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
    location: 'Main Sanctuary',
    capacity: 80,
    spotsLeft: 65,
    description:
      'Choir and band rehearsal for our upcoming Christmas concert. All musicians and vocalists welcome!',
    imageUrl: 'https://example.com/concert.jpg',
    rsvpDeadline: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000).toISOString(),
    currentAttendees: 15,
    waitlistCount: 0,
    userRSVPStatus: 'none',
    requiresApproval: false,
    tags: ['Music', 'Christmas', 'Rehearsal'],
  },
];

// Helper functions for event data
export const getEventById = (id: string): MockEvent | undefined => {
  return MOCK_EVENTS.find(event => event.id === id);
};

export const getUpcomingEvents = (): MockEvent[] => {
  const now = new Date();
  return MOCK_EVENTS.filter(event => new Date(event.startsAt) > now).sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
};

export const getUserRSVPEvents = (): MockEvent[] => {
  return MOCK_EVENTS.filter(
    event =>
      event.userRSVPStatus === 'confirmed' ||
      event.userRSVPStatus === 'waitlisted'
  );
};

export const getEventsByTag = (tag: string): MockEvent[] => {
  return MOCK_EVENTS.filter(event =>
    event.tags.some(eventTag =>
      eventTag.toLowerCase().includes(tag.toLowerCase())
    )
  );
};

export const isEventFull = (event: MockEvent): boolean => {
  return event.spotsLeft === 0;
};

export const canRSVP = (event: MockEvent): boolean => {
  const now = new Date();
  const rsvpDeadline = event.rsvpDeadline
    ? new Date(event.rsvpDeadline)
    : new Date(event.startsAt);

  return now < rsvpDeadline && event.userRSVPStatus === 'none';
};

export const canCancelRSVP = (event: MockEvent): boolean => {
  const now = new Date();
  const eventStart = new Date(event.startsAt);

  return (
    (event.userRSVPStatus === 'confirmed' ||
      event.userRSVPStatus === 'waitlisted') &&
    now < eventStart
  );
};

export default {
  MOCK_EVENTS,
  getEventById,
  getUpcomingEvents,
  getUserRSVPEvents,
  getEventsByTag,
  isEventFull,
  canRSVP,
  canCancelRSVP,
};
