import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CardboardLandingPage from './CardboardLanding';

// Mock all UI components
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

vi.mock('@/components/layout/headers', () => ({
  LandingHeader: ({ children, ...props }: any) => <header {...props}>{children}</header>,
}));

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  Users: () => <div data-testid="users-icon" />,
  MapPin: () => <div data-testid="mappin-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Star: () => <div data-testid="star-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  X: () => <div data-testid="x-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  Instagram: () => <div data-testid="instagram-icon" />,
  Twitter: () => <div data-testid="twitter-icon" />,
  Linkedin: () => <div data-testid="linkedin-icon" />,
  Facebook: () => <div data-testid="facebook-icon" />,
  GamepadIcon: () => <div data-testid="gamepad-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
    main: ({ children, ...props }: any) => <main {...props}>{children}</main>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    a: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    footer: ({ children, ...props }: any) => <footer {...props}>{children}</footer>,
  },
}));

describe('CardboardLandingPage', () => {
  it('renders the CARDBOARD logo', () => {
    render(<CardboardLandingPage />);
    
    expect(screen.getAllByText('CARDBOARD')[0]).toBeInTheDocument();
  });

  it('renders navigation menu items', () => {
    render(<CardboardLandingPage />);
    
    // Use getAllByText since there are multiple "Features" text elements
    expect(screen.getAllByText('Features')[0]).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });
});
