# 🤖 Google ADK Multi-Agent System — Kura Kani
> **Root Orchestrator + 9 Specialist Agents + 18 Sub-Agents**
> Built on Google Agent Development Kit (ADK) — Python

---

## 📌 What is Google ADK?

Google **Agent Development Kit (ADK)** is an open-source Python framework for building, orchestrating, and deploying AI agents. It supports:
- **Multi-agent pipelines** (orchestrator → specialist → sub-agent)
- **Tool use** (functions, APIs, shell commands)
- **State sharing** between agents
- **Gemini 2.0** as the LLM backbone
- Free to use (pay only for Gemini API calls — free tier: 1500 req/day)

**Install:**
```bash
pip install google-adk
```

**Free Gemini API Key:** https://aistudio.google.com/app/apikey

---

## 🏗️ Full Agent Architecture

```
ROOT ORCHESTRATOR AGENT
│   "chat_app_orchestrator"
│   Reads task → routes to correct specialist → collects results
│
├── 1. 🔐 SECURITY AGENT          → security_agent.md
│   ├── Key Manager Sub-Agent
│   ├── Audit Sub-Agent
│   └── Threat Model Sub-Agent
│
├── 2. 🖥️ BACKEND AGENT           → backend_agent.md
│   ├── Auth Sub-Agent
│   ├── Messaging Sub-Agent
│   └── File Handler Sub-Agent
│
├── 3. 📱 FRONTEND AGENT          → frontend_agent.md
│   ├── UI Components Sub-Agent
│   └── Crypto-UI Sub-Agent
│
├── 4. 🗄️ DATABASE AGENT          → database_agent.md
│   ├── Schema Designer Sub-Agent
│   └── Migration Sub-Agent
│
├── 5. 📞 WEBRTC AGENT            → webrtc_agent.md
│   ├── Signaling Sub-Agent
│   └── TURN Config Sub-Agent
│
├── 6. 🧪 TESTING AGENT           → testing_agent.md
│   ├── Unit Test Sub-Agent
│   └── Security Test Sub-Agent
│
├── 7. 🚀 DEVOPS AGENT            → devops_agent.md
│   ├── CI/CD Sub-Agent
│   └── Monitoring Sub-Agent
│
├── 8. 🔔 NOTIFICATION AGENT      → notification_agent.md
│
└── 9. 📄 DOCUMENTATION AGENT     → documentation_agent.md
```

---

## 📁 File Map (Read This First)

| File | Agent | Responsibility |
|------|-------|---------------|
| `00_MASTER_ORCHESTRATOR.md` | Root | This file — system overview + setup |
| `01_security_agent.md` | Security | E2EE, keys, threat model, audit |
| `02_backend_agent.md` | Backend | API, auth, messaging, files |
| `03_frontend_agent.md` | Frontend | React Native, UI, crypto client |
| `04_database_agent.md` | Database | Schema, migrations, queries |
| `05_webrtc_agent.md` | WebRTC | Calls, signaling, TURN server |
| `06_testing_agent.md` | Testing | Unit, integration, security tests |
| `07_devops_agent.md` | DevOps | CI/CD, deploy, monitoring |
| `08_notification_agent.md` | Notifications | FCM, push, background sync |
| `09_documentation_agent.md` | Docs | README, API docs, changelogs |

---

## ⚙️ Project Setup

### Directory Structure
```
chat-app-agents/
├── .env
├── requirements.txt
├── main.py                    ← Run this to start orchestrator
├── orchestrator/
│   └── root_agent.py
├── agents/
│   ├── security_agent.py
│   ├── backend_agent.py
│   ├── frontend_agent.py
│   ├── database_agent.py
│   ├── webrtc_agent.py
│   ├── testing_agent.py
│   ├── devops_agent.py
│   ├── notification_agent.py
│   └── documentation_agent.py
├── sub_agents/
│   ├── security/
│   │   ├── key_manager.py
│   │   ├── auditor.py
│   │   └── threat_model.py
│   ├── backend/
│   │   ├── auth_agent.py
│   │   ├── messaging_agent.py
│   │   └── file_handler_agent.py
│   ├── frontend/
│   │   ├── ui_agent.py
│   │   └── crypto_ui_agent.py
│   ├── database/
│   │   ├── schema_agent.py
│   │   └── migration_agent.py
│   ├── webrtc/
│   │   ├── signaling_agent.py
│   │   └── turn_agent.py
│   ├── testing/
│   │   ├── unit_test_agent.py
│   │   └── security_test_agent.py
│   └── devops/
│       ├── cicd_agent.py
│       └── monitoring_agent.py
├── tools/
│   ├── file_tools.py          ← Read/write code files
│   ├── shell_tools.py         ← Run commands
│   ├── git_tools.py           ← Git operations
│   └── search_tools.py        ← Web search
└── shared/
    ├── state.py               ← Shared state between agents
    └── prompts.py             ← Shared system prompt parts
```

### requirements.txt
```
google-adk==1.0.0
google-generativeai>=0.8.0
python-dotenv>=1.0.0
pydantic>=2.0.0
rich>=13.0.0
gitpython>=3.1.0
requests>=2.31.0
```

### .env
```env
GOOGLE_API_KEY=your_gemini_api_key_here
GOOGLE_GENAI_USE_VERTEXAI=FALSE
PROJECT_ROOT=/path/to/your/chat-app
GITHUB_TOKEN=your_github_token
```

---

## 🤖 Root Orchestrator Code

```python
# orchestrator/root_agent.py

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
    description="Master orchestrator that routes tasks to specialist agents for building Kura Kani.",
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
```

---

## ▶️ main.py — Run the System

```python
# main.py
import asyncio
from dotenv import load_dotenv
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.adk.types import Content, Part
from orchestrator.root_agent import root_agent
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown

load_dotenv()
console = Console()

APP_NAME = "secure_chat_app_builder"
USER_ID = "developer"

async def run_agent_system():
    session_service = InMemorySessionService()
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
    )

    runner = Runner(
        agent=root_agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    console.print(Panel.fit(
        "[bold green]🤖 Kura Kani — Multi-Agent System[/bold green]\n"
        "[dim]Powered by Google ADK + Gemini 2.0[/dim]",
        border_style="green"
    ))

    while True:
        user_input = console.input("\n[bold cyan]You:[/bold cyan] ").strip()
        if user_input.lower() in ("exit", "quit", "q"):
            console.print("[dim]Shutting down agents...[/dim]")
            break

        message = Content(role="user", parts=[Part(text=user_input)])

        console.print("\n[bold yellow]🤖 Agents working...[/bold yellow]")

        async for event in runner.run_async(
            user_id=USER_ID,
            session_id=session.id,
            new_message=message,
        ):
            if event.is_final_response() and event.content:
                for part in event.content.parts:
                    if part.text:
                        console.print(Panel(
                            Markdown(part.text),
                            title="[bold green]Agent Response[/bold green]",
                            border_style="green"
                        ))

if __name__ == "__main__":
    asyncio.run(run_agent_system())
```

---

## 💡 Example Prompts to Run

```bash
python main.py
```

Then type:
```
> Generate the X3DH key exchange implementation for the security module
> Create the Fastify auth routes with JWT and refresh tokens
> Design the PostgreSQL schema for messages with encryption support
> Write the WebRTC signaling handler for 1:1 video calls
> Create unit tests for the encryption service
> Set up the GitHub Actions CI/CD pipeline for Railway deployment
> Generate Firebase FCM integration for background push notifications
> Write the API documentation for the messaging endpoints
> Audit the login endpoint for security vulnerabilities
> Build the React Native chat screen component
```

---

## 🔁 Agent Communication Flow

```
User Input
    │
    ▼
Root Orchestrator (Gemini 2.0)
    │  Analyzes task
    │  Selects agent(s)
    │
    ├──► Specialist Agent
    │         │  Has own system prompt + tools
    │         │  May spawn sub-agents
    │         │
    │         ├──► Sub-Agent A (focused task)
    │         └──► Sub-Agent B (focused task)
    │                   │
    │              Returns result
    │                   │
    │         Specialist synthesizes
    │                   │
    └──────────── Returns to Orchestrator
                        │
              Orchestrator synthesizes
                        │
                   Final Response
                        │
                    User sees output
```

---

*Read each numbered .md file for the full agent code, tools, and prompts for each specialist.*
