/**
 * Mock Expo Secure Store
 */

const mockSecureStorage: { [key: string]: string } = {};

export const setItemAsync = jest.fn(
  (key: string, value: string, options?: any) => {
    mockSecureStorage[key] = value;
    return Promise.resolve();
  }
);

export const getItemAsync = jest.fn((key: string, options?: any) => {
  return Promise.resolve(mockSecureStorage[key] || null);
});

export const deleteItemAsync = jest.fn((key: string, options?: any) => {
  delete mockSecureStorage[key];
  return Promise.resolve();
});

export const isAvailableAsync = jest.fn(() => Promise.resolve(true));

// Clear mock storage between tests
export const clearMockStorage = () => {
  Object.keys(mockSecureStorage).forEach(key => delete mockSecureStorage[key]);
};

// Export for testing purposes
export const getMockStorage = () => ({ ...mockSecureStorage });
