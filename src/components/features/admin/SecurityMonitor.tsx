import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Activity, Clock, User, Globe } from "lucide-react";

interface SecurityEvent {
  id: string;
  eventType: string;
  userId: string;
  userEmail: string;
  userName: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
}

interface SecurityMonitorProps {
  className?: string;
}

export function SecurityMonitor({ className }: SecurityMonitorProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const eventSource = new EventSource("/api/admin/security-logs/stream");
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents(data.events);
        setError(null);
      } catch (err) {
        setError("Failed to parse security event data");
      } finally {
        setLoading(false);
      }
    };

    eventSource.onerror = (_err) => {
      setError("Error receiving security events");
      setLoading(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      default: return "default";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return "🚨";
      case "high": return "⚠️";
      case "medium": return "📋";
      default: return "📝";
    }
  };

  const getEventDescription = (event: SecurityEvent) => {
    switch (event.eventType) {
      case "rate_limit_exceeded":
        return "Upload rate limit exceeded";
      case "invalid_file_type":
        return `Invalid file type: ${event.details.detectedType}`;
      case "path_traversal_attempt":
        return `Path traversal attempt: ${event.details.reason}`;
      case "suspicious_compression":
        return `Suspicious compression ratio: ${event.details.compressionRatio}`;
      case "file_size_exceeded":
        return `File size exceeded: ${Math.round(event.details.fileSize / 1024 / 1024)}MB`;
      case "avatar_upload_success":
        return "Avatar uploaded successfully";
      case "avatar_upload_failed":
        return `Avatar upload failed: ${event.details.error}`;
      default:
        return event.eventType.replace(/_/g, " ");
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Activity className="h-4 w-4 animate-pulse mr-2" />
            Loading security events...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load security events: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Event Monitor
            <Badge variant="secondary" className="ml-auto">
              {events.length} events
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.length === 0 ? (
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  No security events detected in the recent period.
                </AlertDescription>
              </Alert>
            ) : (
              events.map((event) => (
                <Alert
                  key={event.id}
                  className="border-l-4"
                  style={{
                    borderLeftColor:
                      event.severity === "critical" || event.severity === "high"
                        ? "#ef4444"
                        : event.severity === "medium"
                        ? "#f59e0b"
                        : "#10b981",
                  }}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="text-lg mt-1">
                      {getSeverityIcon(event.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={getSeverityColor(event.severity) as any}
                          className="shrink-0"
                        >
                          {event.eventType}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(event.timestamp)}
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">
                          {getEventDescription(event)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                              {event.userEmail}
                            </span>
                          </div>
                          
                          {event.ipAddress && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span>{event.ipAddress}</span>
                            </div>
                          )}
                        </div>
                        
                        {Object.keys(event.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                              View details
                            </summary>
                            <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
