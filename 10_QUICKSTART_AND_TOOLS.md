# ⚡ Quick Start & Shared Tools Reference
> **Get the entire multi-agent system running in 10 minutes**

---

## 🚀 Quick Start (10 Minutes)

```bash
# 1. Clone / create project
mkdir chat-app-agents && cd chat-app-agents

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install google-adk python-dotenv rich gitpython requests

# 4. Get free Gemini API key
# → https://aistudio.google.com/app/apikey
# Free tier: 1500 requests/day, 1M tokens/min

# 5. Set up environment
cat > .env << 'EOF'
GOOGLE_API_KEY=your_key_here
GOOGLE_GENAI_USE_VERTEXAI=FALSE
PROJECT_ROOT=/path/to/your/chat-app
EOF

# 6. Run the system
python main.py
```

---

## 🛠️ Shared Tools (Used by All Agents)

```python
# tools/file_tools.py
import os
from google.adk.tools import FunctionTool

PROJECT_ROOT = os.getenv("PROJECT_ROOT", ".")

def read_file(path: str) -> str:
    """Read a source file from the chat app project."""
    with open(os.path.join(PROJECT_ROOT, path)) as f:
        return f.read()

def write_file(path: str, content: str) -> str:
    """Write generated code to the chat app project."""
    full = os.path.join(PROJECT_ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    return f"✅ Written: {path}"

def list_files(directory: str = ".") -> list[str]:
    """List source files, excluding node_modules and build artifacts."""
    full = os.path.join(PROJECT_ROOT, directory)
    result = []
    SKIP = {'node_modules', '.git', '__pycache__', 'dist', 'build', '.expo'}
    for root, dirs, files in os.walk(full):
        dirs[:] = [d for d in dirs if d not in SKIP]
        for file in files:
            result.append(os.path.relpath(os.path.join(root, file), full))
    return result

def append_to_file(path: str, content: str) -> str:
    """Append content to an existing file."""
    full = os.path.join(PROJECT_ROOT, path)
    with open(full, "a") as f:
        f.write("\n" + content)
    return f"✅ Appended to: {path}"
```

```python
# tools/shell_tools.py
import subprocess
from google.adk.tools import FunctionTool

def run_command(command: str, working_dir: str = ".") -> dict:
    """
    Run a shell command in the project directory.
    Use for: npm install, npm test, npm run lint, git operations.
    Returns: { stdout, stderr, returncode }
    """
    result = subprocess.run(
        command, shell=True,
        cwd=os.path.join(os.getenv("PROJECT_ROOT", "."), working_dir),
        capture_output=True, text=True, timeout=120
    )
    return {
        "stdout": result.stdout[:3000],  # limit output size
        "stderr": result.stderr[:1000],
        "returncode": result.returncode,
        "success": result.returncode == 0
    }

def run_tests(test_path: str = "") -> dict:
    """Run the test suite and return results."""
    cmd = f"npm run test {test_path} -- --reporter=verbose"
    return run_command(cmd)

def run_lint() -> dict:
    """Run ESLint on the project."""
    return run_command("npm run lint")

def check_types() -> dict:
    """Run TypeScript type checking."""
    return run_command("npx tsc --noEmit")
```

```python
# tools/git_tools.py
import subprocess, os

def git_status() -> str:
    """Get current git status."""
    result = subprocess.run(
        "git status --short", shell=True,
        cwd=os.getenv("PROJECT_ROOT", "."),
        capture_output=True, text=True
    )
    return result.stdout

def git_diff(file_path: str = "") -> str:
    """Get git diff for a file or all changes."""
    result = subprocess.run(
        f"git diff {file_path}", shell=True,
        cwd=os.getenv("PROJECT_ROOT", "."),
        capture_output=True, text=True
    )
    return result.stdout[:5000]

def git_log(n: int = 10) -> str:
    """Get last N git commits."""
    result = subprocess.run(
        f"git log --oneline -{n}", shell=True,
        cwd=os.getenv("PROJECT_ROOT", "."),
        capture_output=True, text=True
    )
    return result.stdout
```

---

## 🗣️ Prompt Templates

### Run a Specific Agent Directly

```python
# Run security agent directly (skip orchestrator)
from agents.security_agent import security_agent
from google.adk.runners import Runner

# ... same runner setup as main.py but with security_agent
```

### Batch Tasks (Run Multiple at Once)

```
> Do all of these:
  1. Generate X3DH key exchange TypeScript code (security)
  2. Write unit tests for it (testing)
  3. Add JSDoc comments (documentation)
```

The orchestrator routes tasks 1, 2, 3 to security_agent, testing_agent, and documentation_agent in sequence, then returns combined output.

### Code Review Mode

```
> Review the file src/routes/auth.ts for:
  1. Security vulnerabilities
  2. Missing test coverage
  3. Documentation gaps
```

Orchestrator invokes security_agent (audit), testing_agent (coverage check), documentation_agent (doc check).

### Sprint Mode

```
> Complete Sprint 2: Implement E2EE core
  - Generate key bundle code
  - Store keys in Keychain
  - Implement X3DH
  - Write tests
  - Add documentation
```

---

## 📊 Agent Capability Matrix

| Task | Security | Backend | Frontend | Database | WebRTC | Testing | DevOps | Notif | Docs |
|------|:--------:|:-------:|:--------:|:--------:|:------:|:-------:|:------:|:-----:|:----:|
| E2EE / Crypto | ✅ | | ✅ | | | ✅ | | | ✅ |
| API Routes | | ✅ | | | | ✅ | | | ✅ |
| UI Screens | | | ✅ | | | ✅ | | | |
| DB Schema | ✅ | | | ✅ | | | | | ✅ |
| Audio/Video Calls | | | ✅ | | ✅ | ✅ | | | |
| CI/CD | | | | | | | ✅ | | |
| Push Notifications | | ✅ | ✅ | | | | | ✅ | |
| Security Audit | ✅ | | | | | ✅ | | | |
| Load Testing | | | | | | ✅ | ✅ | | |
| Documentation | | | | | | | | | ✅ |

---

## 💰 Cost Summary

| Service | Free Limit | Paid if Exceeded |
|---------|-----------|-----------------|
| Gemini API (ADK) | 1,500 req/day | $0.075/1M tokens |
| Railway (backend) | $5 credit/mo | $0.000463/GB-hour |
| Supabase | 500MB DB, 1GB storage | $25/mo (Pro) |
| Oracle Cloud TURN | Always free | N/A |
| GitHub Actions | 2,000 min/mo | $0.008/min |
| Firebase FCM | Unlimited | Free forever |
| Sentry | 5,000 events/mo | $26/mo (Team) |
| **Total** | **$0/month** | |

---

## 📁 Complete File Index

```
chat_app_agents/
├── 00_MASTER_ORCHESTRATOR.md   ← Start here. System overview + root agent
├── 01_security_agent.md        ← E2EE, keys, audits, threat models
├── 02_backend_agent.md         ← Fastify API, auth, messaging, files
├── 03_frontend_agent.md        ← React Native, UI, crypto integration
├── 04_database_agent.md        ← PostgreSQL, migrations, queries
├── 05_webrtc_agent.md          ← Calls, signaling, TURN server
├── 06_testing_agent.md         ← Unit, integration, security tests
├── 07_08_09_agents.md          ← DevOps + Notifications + Documentation
└── 10_QUICKSTART_AND_TOOLS.md  ← This file. Setup + shared tools
```

---

*System design: 1 root orchestrator + 9 specialists + 18 sub-agents = 28 total agents*
*Monthly cost: $0 | Gemini free tier sufficient for active development*
