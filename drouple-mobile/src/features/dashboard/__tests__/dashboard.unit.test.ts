import React from 'react';
import { render } from '../../../test/setup.component';
import { DashboardScreen } from '../screens/DashboardScreen';

jest.mock('../../../lib/store/authStore');

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText).toBeDefined();
  });
});
