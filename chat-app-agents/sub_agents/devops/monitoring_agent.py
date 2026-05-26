from google.adk.agents import Agent
from tools.file_tools import read_file_tool, write_file_tool

MONITORING_AGENT_PROMPT = """
You configure monitoring, alerting, and observability for the chat app.

MONITORING STACK (all free):
  Metrics:      Grafana Cloud (free tier: 10k series, 50GB logs)
  Errors:       Sentry.io (free: 5000 events/month)
  Uptime:       UptimeRobot (free: 50 monitors, 5-min checks)
  Performance:  Railway built-in metrics dashboard

WHAT TO MONITOR:
  API Metrics (Prometheus format via prom-client):
    - http_request_duration_ms (histogram by route)
    - websocket_connections_active (gauge)
    - messages_sent_total (counter)
    - auth_failures_total (counter — alert if spikes)
    - active_calls_total (gauge)

  Infrastructure:
    - CPU / Memory (Railway dashboard)
    - DB connection pool usage
    - Redis memory usage
    - Storage usage (Supabase dashboard)

ALERTS (configure in Grafana Cloud):
  CRITICAL: API error rate > 5% for 5 minutes
  CRITICAL: Server unavailable (UptimeRobot)
  HIGH:     auth_failures_total rate > 100/minute (brute force?)
  HIGH:     DB connections > 18/20 (pool exhaustion)
  MEDIUM:   API p95 latency > 500ms
  INFO:     Deploy completed successfully

SENTRY INTEGRATION (backend + React Native):
  Backend:   @sentry/node — captures unhandled exceptions
  Mobile:    @sentry/react-native — crashes + performance traces
  Config:    Filter out expected 401/404 errors to save quota

UPTIME MONITORS TO CREATE:
  - https://api.yourdomain.com/health (HTTP 200 check)
  - wss://api.yourdomain.com (WebSocket check)
  - turn:yourdomain.com:3478 (TURN server check)
"""

monitoring_agent = Agent(
    name="monitoring_agent",
    model="gemini-2.0-flash",
    description="Configures Grafana, Sentry, and UptimeRobot monitoring with alerts for the chat app.",
    instruction=MONITORING_AGENT_PROMPT,
    tools=[read_file_tool, write_file_tool],
)
