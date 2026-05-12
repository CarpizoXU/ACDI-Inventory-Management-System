import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import store from '../store/store';
import LoginPage from '../pages/Login';

describe('LoginPage', () => {
  test('renders login heading', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText(/ACDI Inventory Login/i)).toBeTruthy();
  });
});
