import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SecurityMonitor } from './SecurityMonitor';

// Mock the UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/ui/alert/alert', () => ({
  Alert: ({ children, className, style, variant }: any) => (
    <div className={className} style={style} data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={className} data-variant={variant}>
      {children}
    </span>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  User: () => <div data-testid="user-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
}));

// Mock EventSource
class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState: number = 1; // OPEN
  
  constructor(public url: string) {}
  
  close() {
    this.readyState = 2; // CLOSED
  }
  
  // Helper method to trigger events
  triggerMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
    }
  }
  
  triggerError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Store reference to mock instances
let mockEventSourceInstance: MockEventSource | null = null;

// Mock EventSource globally
Object.defineProperty(global, 'EventSource', {
  writable: true,
  value: vi.fn().mockImplementation((url: string) => {
    mockEventSourceInstance = new MockEventSource(url);
    return mockEventSourceInstance;
  }),
});

describe('SecurityMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockEventSourceInstance = null;
  });

  afterEach(() => {
    vi.useRealTimers();
    if (mockEventSourceInstance) {
      mockEventSourceInstance.close();
    }
  });

  it('should render loading state initially', () => {
    render(<SecurityMonitor />);
    
    expect(screen.getByText('Loading security events...')).toBeInTheDocument();
    expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
  });

  it('should establish SSE connection on mount', () => {
    render(<SecurityMonitor />);
    
    expect(global.EventSource).toHaveBeenCalledWith('/api/admin/security-logs/stream');
    expect(mockEventSourceInstance).not.toBeNull();
  });

  it('should render security events when received', async () => {
    render(<SecurityMonitor />);
    
    const mockEvents = [
      {
        id: '1',
        eventType: 'rate_limit_exceeded',
        userId: 'user123',
        userEmail: 'test@example.com',
        userName: 'Test User',
        timestamp: '2024-01-01T12:00:00Z',
        severity: 'high' as const,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: { attempts: 10 }
      }
    ];

    await act(async () => {
      mockEventSourceInstance?.triggerMessage({ events: mockEvents });
    });

    expect(screen.getByText('Security Event Monitor')).toBeInTheDocument();
    expect(screen.getByText('1 events')).toBeInTheDocument();
    expect(screen.getByText('rate_limit_exceeded')).toBeInTheDocument();
    expect(screen.getByText('Upload rate limit exceeded')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('should handle empty events list', async () => {
    render(<SecurityMonitor />);
    
    await act(async () => {
      mockEventSourceInstance?.triggerMessage({ events: [] });
    });

    expect(screen.getByText('0 events')).toBeInTheDocument();
    expect(screen.getByText('No security events detected in the recent period.')).toBeInTheDocument();
  });

  it('should handle SSE connection errors', async () => {
    render(<SecurityMonitor />);
    
    await act(async () => {
      mockEventSourceInstance?.triggerError();
    });

    expect(screen.getByText('Failed to load security events: Error receiving security events')).toBeInTheDocument();
    expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
  });

  it('should handle JSON parsing errors', async () => {
    render(<SecurityMonitor />);
    
    await act(async () => {
      if (mockEventSourceInstance?.onmessage) {
        mockEventSourceInstance.onmessage({ data: 'invalid json' } as MessageEvent);
      }
    });

    expect(screen.getByText('Failed to load security events: Failed to parse security event data')).toBeInTheDocument();
  });

  it('should implement reconnection with backoff', async () => {
    render(<SecurityMonitor />);
    
    // Trigger first error
    await act(async () => {
      mockEventSourceInstance?.triggerError();
    });

    // Should attempt reconnection
    act(() => {
      vi.advanceTimersByTime(2000); // First backoff delay
    });

    expect(global.EventSource).toHaveBeenCalledTimes(2);
  });

  it('should limit reconnection attempts', async () => {
    render(<SecurityMonitor />);
    
    // Trigger multiple errors to exceed retry limit
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        mockEventSourceInstance?.triggerError();
      });
      
      if (i < 5) {
        act(() => {
          vi.advanceTimersByTime(30000); // Max backoff delay
        });
      }
    }

    // Should stop reconnecting after 5 attempts
    expect(global.EventSource).toHaveBeenCalledTimes(6); // Initial + 5 retries
  });

  it('should close SSE connection on unmount', () => {
    const { unmount } = render(<SecurityMonitor />);
    
    const closeSpy = vi.spyOn(mockEventSourceInstance!, 'close');
    
    unmount();
    
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should render different severity badges correctly', async () => {
    render(<SecurityMonitor />);
    
    const mockEvents = [
      {
        id: '1',
        eventType: 'critical_event',
        userId: 'user1',
        userEmail: 'user1@example.com',
        userName: 'User 1',
        timestamp: '2024-01-01T12:00:00Z',
        severity: 'critical' as const,
        details: {}
      },
      {
        id: '2',
        eventType: 'high_event',
        userId: 'user2',
        userEmail: 'user2@example.com',
        userName: 'User 2',
        timestamp: '2024-01-01T12:01:00Z',
        severity: 'high' as const,
        details: {}
      },
      {
        id: '3',
        eventType: 'medium_event',
        userId: 'user3',
        userEmail: 'user3@example.com',
        userName: 'User 3',
        timestamp: '2024-01-01T12:02:00Z',
        severity: 'medium' as const,
        details: {}
      },
      {
        id: '4',
        eventType: 'low_event',
        userId: 'user4',
        userEmail: 'user4@example.com',
        userName: 'User 4',
        timestamp: '2024-01-01T12:03:00Z',
        severity: 'low' as const,
        details: {}
      }
    ];

    await act(async () => {
      mockEventSourceInstance?.triggerMessage({ events: mockEvents });
    });

    const criticalBadge = screen.getByText('critical_event');
    const highBadge = screen.getByText('high_event');
    const mediumBadge = screen.getByText('medium_event');
    const lowBadge = screen.getByText('low_event');

    expect(criticalBadge).toHaveAttribute('data-variant', 'destructive');
    expect(highBadge).toHaveAttribute('data-variant', 'destructive');
    expect(mediumBadge).toHaveAttribute('data-variant', 'secondary');
    expect(lowBadge).toHaveAttribute('data-variant', 'default');
  });

  it('should render correct event descriptions for different event types', async () => {
    render(<SecurityMonitor />);
    
    const mockEvents = [
      {
        id: '1',
        eventType: 'invalid_file_type',
        userId: 'user1',
        userEmail: 'user1@example.com',
        userName: 'User 1',
        timestamp: '2024-01-01T12:00:00Z',
        severity: 'high' as const,
        details: { detectedType: 'application/x-executable' }
      },
      {
        id: '2',
        eventType: 'path_traversal_attempt',
        userId: 'user2',
        userEmail: 'user2@example.com',
        userName: 'User 2',
        timestamp: '2024-01-01T12:01:00Z',
        severity: 'critical' as const,
        details: { reason: 'Directory traversal detected' }
      },
      {
        id: '3',
        eventType: 'suspicious_compression',
        userId: 'user3',
        userEmail: 'user3@example.com',
        userName: 'User 3',
        timestamp: '2024-01-01T12:02:00Z',
        severity: 'medium' as const,
        details: { compressionRatio: 0.95 }
      },
      {
        id: '4',
        eventType: 'file_size_exceeded',
        userId: 'user4',
        userEmail: 'user4@example.com',
        userName: 'User 4',
        timestamp: '2024-01-01T12:03:00Z',
        severity: 'medium' as const,
        details: { fileSize: 10485760 } // 10MB
      }
    ];

    await act(async () => {
      mockEventSourceInstance?.triggerMessage({ events: mockEvents });
    });

    expect(screen.getByText('Invalid file type: application/x-executable')).toBeInTheDocument();
    expect(screen.getByText('Path traversal attempt: Directory traversal detected')).toBeInTheDocument();
    expect(screen.getByText('Suspicious compression ratio: 0.95')).toBeInTheDocument();
    expect(screen.getByText('File size exceeded: 10MB')).toBeInTheDocument();
  });

  it('should render success events correctly', async () => {
    render(<SecurityMonitor />);
    
    const mockEvents = [
      {
        id: '1',
        eventType: 'avatar_upload_success',
        userId: 'user1',
        userEmail: 'user1@example.com',
        userName: 'User 1',
        timestamp: '2024-01-01T12:00:00Z',
        severity: 'low' as const,
        details: { filename: 'avatar.jpg' }
      },
      {
        id: '2',
        eventType: 'avatar_upload_failed',
        userId: 'user2',
        userEmail: 'user2@example.com',
        userName: 'User 2',
        timestamp: '2024-01-01T12:01:00Z',
        severity: 'medium' as const,
        details: { error: 'File too large' }
      }
    ];

    await act(async () => {
      mockEventSourceInstance?.triggerMessage({ events: mockEvents });
    });

    expect(screen.getByText('Avatar uploaded successfully')).toBeInTheDocument();
    expect(screen.getByText('Avatar upload failed: File too large')).toBeInTheDocument();
  });

  it('should handle custom event types with fallback descriptions', async () => {
    render(<SecurityMonitor />);
    
    const mockEvents = [
      {
        id: '1',
        eventType: 'custom_security_event',
        userId: 'user1',
        userEmail: 'user1@example.com',
        userName: 'User 1',
        timestamp: '2024-01-01T12:00:00Z',
        severity: 'medium' as const,
        details: {}
      }
    ];

    await act(async () => {
      mockEventSourceInstance?.triggerMessage({ events: mockEvents });
    });

    expect(screen.getByText('custom security event')).toBeInTheDocument();
  });

  it('should render event details in expandable section', async () => {
    render(<SecurityMonitor />);
    
    const mockEvents = [
      {
        id: '1',
        eventType: 'test_event',
        userId: 'user1',
        userEmail: 'user1@example.com',
        userName: 'User 1',
        timestamp: '2024-01-01T12:00:00Z',
        severity: 'medium' as const,
        details: { 
          key1: 'value1',
          key2: 'value2',
          nested: { prop: 'test' }
        }
      }
    ];

    await act(async () => {
      mockEventSourceInstance?.triggerMessage({ events: mockEvents });
    });

    const detailsToggle = screen.getByText('View details');
    expect(detailsToggle).toBeInTheDocument();
    
    // Check that details are rendered in JSON format
    expect(screen.getByText(/"key1": "value1"/)).toBeInTheDocument();
  });

  it('should format timestamps correctly', async () => {
    render(<SecurityMonitor />);
    
    const testDate = '2024-01-01T12:00:00Z';
    const mockEvents = [
      {
        id: '1',
        eventType: 'test_event',
        userId: 'user1',
        userEmail: 'user1@example.com',
        userName: 'User 1',
        timestamp: testDate,
        severity: 'low' as const,
        details: {}
      }
    ];

    await act(async () => {
      mockEventSourceInstance?.triggerMessage({ events: mockEvents });
    });

    const expectedFormattedDate = new Date(testDate).toLocaleString();
    expect(screen.getByText(expectedFormattedDate)).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    render(<SecurityMonitor className="custom-class" />);
    
    expect(document.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should show IP address when available', async () => {
    render(<SecurityMonitor />);
    
    const mockEvents = [
      {
        id: '1',
        eventType: 'test_event',
        userId: 'user1',
        userEmail: 'user1@example.com',
        userName: 'User 1',
        timestamp: '2024-01-01T12:00:00Z',
        severity: 'low' as const,
        ipAddress: '10.0.0.1',
        details: {}
      }
    ];

    await act(async () => {
      mockEventSourceInstance?.triggerMessage({ events: mockEvents });
    });

    expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
    expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
  });

  it('should handle events without IP address', async () => {
    render(<SecurityMonitor />);
    
    const mockEvents = [
      {
        id: '1',
        eventType: 'test_event',
        userId: 'user1',
        userEmail: 'user1@example.com',
        userName: 'User 1',
        timestamp: '2024-01-01T12:00:00Z',
        severity: 'low' as const,
        details: {}
      }
    ];

    await act(async () => {
      mockEventSourceInstance?.triggerMessage({ events: mockEvents });
    });

    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('globe-icon')).not.toBeInTheDocument();
  });

  it('should reset error state on successful connection', async () => {
    render(<SecurityMonitor />);
    
    // First trigger an error
    await act(async () => {
      mockEventSourceInstance?.triggerError();
    });
    
    expect(screen.getByText(/Failed to load security events/)).toBeInTheDocument();
    
    // Then receive successful data
    await act(async () => {
      mockEventSourceInstance?.triggerMessage({ events: [] });
    });
    
    expect(screen.queryByText(/Failed to load security events/)).not.toBeInTheDocument();
    expect(screen.getByText('Security Event Monitor')).toBeInTheDocument();
  });

  it('should reset reconnect attempts on successful connection', async () => {
    render(<SecurityMonitor />);
    
    // Trigger an error and wait for first reconnect
    await act(async () => {
      mockEventSourceInstance?.triggerError();
    });
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    // Successfully receive data to reset attempts
    await act(async () => {
      mockEventSourceInstance?.triggerMessage({ events: [] });
    });
    
    // Trigger another error - should start with minimum backoff again
    await act(async () => {
      mockEventSourceInstance?.triggerError();
    });
    
    act(() => {
      vi.advanceTimersByTime(2000); // Should reconnect with initial delay
    });
    
    expect(global.EventSource).toHaveBeenCalledTimes(3); // Initial + retry + retry (success doesn't create new connection)
  });
});
