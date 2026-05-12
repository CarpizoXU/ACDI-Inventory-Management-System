import { render, screen } from '@testing-library/react';
import LoginPage from '../pages/Login';

describe('LoginPage', () => {
  test('renders login heading', () => {
    render(<LoginPage />);
    expect(screen.getByText(/ACDI Inventory Login/i)).toBeInTheDocument();
  });
});
