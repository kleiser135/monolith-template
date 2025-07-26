import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loading from './loading';

describe('Loading Component', () => {
  it('renders the loading spinner', () => {
    render(<Loading />);

    // Check for the loader component by its test id
    const loader = screen.getByTestId('loader');
    expect(loader).toBeInTheDocument();
  });
}); 