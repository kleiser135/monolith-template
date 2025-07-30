import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CardboardLandingPage from './CardboardLanding';

// Mock all UI components
vi.mock('@/components/ui/button/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/input/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/textarea/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
  },
}));

describe('CardboardLandingPage', () => {
  it('renders the CARDBOARD logo', () => {
    render(<CardboardLandingPage />);
    
    expect(screen.getAllByText('CARDBOARD')[0]).toBeInTheDocument();
  });

  it('renders navigation menu items', () => {
    render(<CardboardLandingPage />);
    
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });
});
