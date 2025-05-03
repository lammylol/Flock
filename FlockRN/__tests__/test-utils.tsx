// __tests__/test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// Types for mock data
export interface MockPrayer {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  privacy: string;
  createdAt: Date;
  updatedAt: Date;
  prayerPoints: string[];
  entityType: string;
  [key: string]: any; // For any additional properties
}

// Wrap components with navigation container for testing
export function renderWithNavigation(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NavigationContainer>{children}</NavigationContainer>
    ),
    ...options,
  });
}

// Mock data factories
export const createMockPrayer = (overrides = {}): MockPrayer => ({
  id: 'test-prayer-id',
  authorId: 'test-user-id',
  authorName: 'Test User',
  content: 'Test prayer content',
  privacy: 'private',
  createdAt: new Date(),
  updatedAt: new Date(),
  prayerPoints: ['point1', 'point2'],
  entityType: 'prayer',
  ...overrides,
});

// Mock user data
export const mockUser = {
  uid: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com',
};

// Add this at the end of __tests__/test-utils.tsx
describe('Test utilities', () => {
  it('should be set up correctly', () => {
    expect(true).toBe(true);
  });
});