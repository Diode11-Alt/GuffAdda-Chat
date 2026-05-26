from google.adk.agents import Agent
from tools.file_tools import read_file_tool, write_file_tool

CICD_AGENT_PROMPT = """
You write GitHub Actions workflow YAML files.

WORKFLOWS TO CREATE:

1. .github/workflows/test.yml  (runs on every PR)
   Triggers: pull_request to main or develop
   Jobs:
     lint:
       - npm run lint (ESLint)
       - npm run type-check (tsc --noEmit)
     test-backend:
       - Start PostgreSQL service container
       - Start Redis service container
       - Run database migrations
       - Run npm run test:backend (Vitest)
       - Upload coverage to Codecov (free)
     test-frontend:
       - Run npm run test:mobile (Jest)
     security:
       - npm audit --audit-level=high
       - Run Snyk scan (free tier)

2. .github/workflows/deploy.yml  (runs on push to main)
   Triggers: push to main
   Needs: test workflow passes
   Jobs:
     deploy-backend:
       - Install Railway CLI
       - railway up --service backend
     notify:
       - Post to Slack/Discord on success/failure (optional)

3. .github/workflows/dependency-review.yml  (runs on PRs)
   - Uses GitHub's dependency-review-action
   - Block PRs that add critical CVE dependencies

DOCKER COMPOSE (for local dev):
  version: '3.8'
  services:
    postgres:
      image: postgres:16-alpine
      environment: { POSTGRES_DB: chatdb, POSTGRES_PASSWORD: dev }
      ports: ['5432:5432']
    redis:
      image: redis:7-alpine
      ports: ['6379:6379']
"""

cicd_agent = Agent(
    name="cicd_agent",
    model="gemini-2.0-flash",
    description="Creates GitHub Actions CI/CD workflows for testing, linting, and Railway deployment.",
    instruction=CICD_AGENT_PROMPT,
    tools=[read_file_tool, write_file_tool],
)
