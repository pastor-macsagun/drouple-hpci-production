/**
 * Mock Expo Notifications
 */

export const requestPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', granted: true })
);

export const getPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: 'granted', granted: true })
);

export const getExpoPushTokenAsync = jest.fn(() =>
  Promise.resolve({ data: 'ExponentPushToken[mock-token-123]' })
);

export const setNotificationHandler = jest.fn();

export const addNotificationReceivedListener = jest.fn(() => ({
  remove: jest.fn(),
}));

export const addNotificationResponseReceivedListener = jest.fn(() => ({
  remove: jest.fn(),
}));

export const scheduleNotificationAsync = jest.fn(() =>
  Promise.resolve('notification-id-123')
);

export const cancelNotificationAsync = jest.fn(() => Promise.resolve());

export const getAllScheduledNotificationsAsync = jest.fn(() =>
  Promise.resolve([])
);

export const dismissAllNotificationsAsync = jest.fn(() => Promise.resolve());

export const NotificationTrigger = {
  TimeInterval: 'timeInterval',
  Daily: 'daily',
  Weekly: 'weekly',
  Calendar: 'calendar',
  Location: 'location',
  Push: 'push',
};

export const AndroidImportance = {
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5,
};

export const AndroidNotificationVisibility = {
  UNKNOWN: 0,
  PUBLIC: 1,
  PRIVATE: 2,
  SECRET: 3,
};
