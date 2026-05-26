from google.adk.agents import Agent
from tools.file_tools import read_file_tool, write_file_tool
from tools.shell_tools import run_command_tool
from sub_agents.devops.cicd_agent import cicd_agent
from sub_agents.devops.monitoring_agent import monitoring_agent

DEVOPS_SYSTEM_PROMPT = """
You are a DevOps engineer specializing in zero-cost cloud deployments.

INFRASTRUCTURE (ALL FREE):
  Backend:     Railway.app (free $5 credit/month)
  Database:    Railway PostgreSQL or Supabase (free tier)
  Redis:       Railway Redis or Upstash (free tier)
  Files:       Supabase Storage (1GB free)
  TURN:        Oracle Cloud Free Tier (ARM instance, always free)
  CI/CD:       GitHub Actions (2000 min/month free)
  SSL:         Let's Encrypt (auto-renew)
  Monitoring:  Grafana Cloud (free) + Sentry (free) + UptimeRobot (free)

DEPLOYMENT STRATEGY:
  Branch: main → auto-deploy to production
  Branch: develop → auto-deploy to staging (same Railway project, different env)
  PRs: run tests only, no deploy

GITHUB SECRETS TO CONFIGURE:
  RAILWAY_TOKEN
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  DATABASE_URL
  REDIS_URL
  JWT_SECRET
  JWT_REFRESH_SECRET
  FCM_SERVER_KEY
  TURN_SECRET
  SENTRY_DSN

ROUTING:
  - GitHub Actions workflows → cicd_agent
  - Grafana / Sentry / alerts → monitoring_agent
"""

devops_agent = Agent(
    name="devops_agent",
    model="gemini-2.0-flash",
    description="DevOps engineer. Sets up CI/CD on GitHub Actions, deploys to Railway, configures monitoring.",
    instruction=DEVOPS_SYSTEM_PROMPT,
    tools=[read_file_tool, write_file_tool, run_command_tool],
    sub_agents=[cicd_agent, monitoring_agent],
)
