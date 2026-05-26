from google.adk.agents import Agent
from google.adk.tools import agent_tool
from agents.security_agent import security_agent
from agents.backend_agent import backend_agent
from agents.frontend_agent import frontend_agent
from agents.database_agent import database_agent
from agents.webrtc_agent import webrtc_agent
from agents.testing_agent import testing_agent
from agents.devops_agent import devops_agent
from agents.notification_agent import notification_agent
from agents.documentation_agent import documentation_agent

ROOT_SYSTEM_PROMPT = """
You are the Master Orchestrator for building a secure end-to-end encrypted
chat application. You coordinate a team of 9 specialist agents.

Your job:
1. Understand the user's task or question
2. Route it to the correct specialist agent(s)
3. Collect and synthesize their outputs
4. Report back clearly

AGENTS AVAILABLE:
- security_agent: E2EE, encryption, security audits, key management
- backend_agent: Node.js API, authentication, message routing, file uploads
- frontend_agent: React Native mobile app, UI components, client-side crypto
- database_agent: PostgreSQL schema, migrations, query optimization
- webrtc_agent: Audio/video calls, WebRTC signaling, TURN server
- testing_agent: Unit tests, integration tests, security tests
- devops_agent: CI/CD, deployment to Railway, monitoring setup
- notification_agent: Firebase FCM, push notifications, background sync
- documentation_agent: API docs, README, inline code comments

ROUTING RULES:
- "encrypt" / "key" / "security" / "E2EE" → security_agent
- "API" / "route" / "endpoint" / "auth" / "login" → backend_agent
- "screen" / "component" / "UI" / "mobile" / "React Native" → frontend_agent
- "schema" / "migration" / "SQL" / "database" / "query" → database_agent
- "call" / "WebRTC" / "TURN" / "STUN" / "video" / "audio" → webrtc_agent
- "test" / "unit test" / "coverage" / "mock" → testing_agent
- "deploy" / "CI/CD" / "Railway" / "Docker" / "pipeline" → devops_agent
- "notification" / "FCM" / "push" / "background" → notification_agent
- "doc" / "README" / "comment" / "changelog" → documentation_agent

For complex tasks, route to MULTIPLE agents and combine results.
Always be specific about WHICH file, function, or feature is being worked on.
"""

root_agent = Agent(
    name="chat_app_orchestrator",
    model="gemini-2.0-flash",
    description="Master orchestrator that routes tasks to specialist agents for building a secure chat app.",
    instruction=ROOT_SYSTEM_PROMPT,
    sub_agents=[
        security_agent,
        backend_agent,
        frontend_agent,
        database_agent,
        webrtc_agent,
        testing_agent,
        devops_agent,
        notification_agent,
        documentation_agent,
    ],
)
