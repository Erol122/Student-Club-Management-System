import { render, screen } from '@testing-library/react';
import App from './App';

test('renders student clubs management heading', () => {
  render(<App />);
  expect(
    screen.getByText(/club management system with role-based workflows/i)
  ).toBeInTheDocument();
});
