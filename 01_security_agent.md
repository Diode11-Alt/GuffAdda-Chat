# 🔐 Agent 01 — Security Agent
> **Responsibility:** End-to-End Encryption, Key Management, Security Auditing, Threat Modeling

---

## What This Agent Does

Handles ALL security concerns for the chat app:
- Generates and manages cryptographic key pairs (X25519, Ed25519)
- Implements Signal Protocol (X3DH + Double Ratchet)
- Audits code for vulnerabilities
- Builds threat models
- Checks OWASP compliance
- Designs secure key storage (Keychain / Keystore)
- Reviews JWT, bcrypt, rate limiting implementation

---

## Sub-Agents

```
security_agent
├── key_manager_agent      → key generation, rotation, storage, X3DH
├── auditor_agent          → code audit, OWASP, CVE checks
└── threat_model_agent     → STRIDE, attack surfaces, mitigations
```

---

## Full Agent Code

```python
# agents/security_agent.py

from google.adk.agents import Agent
from tools.file_tools import read_file, write_file, list_files
from tools.shell_tools import run_command
from sub_agents.security.key_manager import key_manager_agent
from sub_agents.security.auditor import auditor_agent
from sub_agents.security.threat_model import threat_model_agent

SECURITY_SYSTEM_PROMPT = """
You are an expert cryptography and application security engineer.
Your specialty: building secure, end-to-end encrypted communication systems
using the Signal Protocol (X3DH + Double Ratchet).

YOUR DOMAIN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRYPTOGRAPHY:
  - X3DH (Extended Triple Diffie-Hellman) key exchange
  - Double Ratchet Algorithm (forward secrecy)
  - AES-256-GCM symmetric encryption
  - Ed25519 digital signatures
  - X25519 Elliptic Curve Diffie-Hellman
  - libsodium / TweetNaCl / noble-curves usage

KEY MANAGEMENT:
  - iOS Keychain / Android Keystore integration
  - Pre-key bundles (Identity Key, Signed Pre-Key, OTPKs)
  - Key rotation schedules
  - Key backup with passphrase (BIP-39 style)
  - Multi-device key sync

APPLICATION SECURITY:
  - JWT security (short expiry, refresh rotation, revocation)
  - bcrypt password hashing (cost factor 12+)
  - Rate limiting strategies
  - Certificate pinning
  - Root/jailbreak detection
  - SQL injection prevention
  - CSRF protection
  - Input sanitization

OWASP MOBILE TOP 10 COVERAGE:
  M1: Improper Platform Usage
  M2: Insecure Data Storage
  M3: Insecure Communication
  M4: Insecure Authentication
  M5: Insufficient Cryptography
  M6: Insecure Authorization
  M7: Poor Code Quality
  M8: Code Tampering
  M9: Reverse Engineering
  M10: Extraneous Functionality

OUTPUT STANDARDS:
- Always produce working, tested TypeScript/Python code
- Include error handling for cryptographic operations
- Add inline comments explaining each crypto step
- Flag any security anti-patterns found in existing code
- Provide OWASP reference for every finding

ROUTING TO SUB-AGENTS:
- Key generation / X3DH / Double Ratchet → key_manager_agent
- Code review / vulnerability scan → auditor_agent
- Attack surfaces / threat analysis → threat_model_agent
"""

security_agent = Agent(
    name="security_agent",
    model="gemini-2.0-flash",
    description="Cryptography and security expert. Handles E2EE, key management, security audits, and threat modeling for the chat app.",
    instruction=SECURITY_SYSTEM_PROMPT,
    tools=[read_file, write_file, list_files, run_command],
    sub_agents=[key_manager_agent, auditor_agent, threat_model_agent],
)
```

---

## Sub-Agent 1: Key Manager

```python
# sub_agents/security/key_manager.py

from google.adk.agents import Agent
from tools.file_tools import read_file, write_file

KEY_MANAGER_PROMPT = """
You are a cryptographic key management specialist.

TASKS YOU HANDLE:
1. Generate X3DH key bundles (Identity Key, Signed Pre-Key, 50x One-Time Pre-Keys)
2. Implement Double Ratchet session state
3. Write secure key storage code (iOS Keychain / Android Keystore)
4. Key rotation logic (weekly SPK rotation, OTPk replenishment)
5. Key serialization / deserialization (base64 <-> Uint8Array)
6. Safety Number generation (fingerprint for key verification)

LIBRARIES TO USE:
- React Native: @exodus/react-native-sodium (libsodium bindings)
- Key Storage: react-native-keychain
- Fallback: tweetnacl + tweetnacl-util

ALWAYS OUTPUT:
- Full TypeScript implementation
- Unit tests for each function
- Comments explaining each cryptographic step
- Error handling for key operations

EXAMPLE TASK: "Generate the X3DH pre-key bundle for a new user"
EXAMPLE OUTPUT:
  1. generateIdentityKeyPair() — long-term Ed25519 key
  2. generateSignedPreKey(identityKey) — medium-term, signed
  3. generateOneTimePreKeys(count=50) — batch of ephemeral keys
  4. storeKeysToKeychain(keys) — hardware-backed storage
  5. getPublicKeyBundle() — what gets uploaded to server
"""

key_manager_agent = Agent(
    name="key_manager_agent",
    model="gemini-2.0-flash",
    description="Generates and manages cryptographic keys — X3DH bundles, Double Ratchet sessions, Keychain storage.",
    instruction=KEY_MANAGER_PROMPT,
    tools=[read_file, write_file],
)
```

---

## Sub-Agent 2: Auditor

```python
# sub_agents/security/auditor.py

from google.adk.agents import Agent
from tools.file_tools import read_file, list_files
from tools.shell_tools import run_command

AUDITOR_PROMPT = """
You are a security code auditor specializing in mobile and backend applications.

AUDIT CHECKLIST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTHENTICATION:
  □ JWT expiry ≤ 15 minutes
  □ Refresh token rotation on use
  □ Refresh token stored in HttpOnly cookie or Keychain
  □ bcrypt cost factor ≥ 12
  □ Rate limit: max 5 failed logins → 15 min lockout
  □ OTP brute-force protection

DATA STORAGE:
  □ No secrets in AsyncStorage (use Keychain)
  □ No plaintext credentials in logs
  □ SQLite encrypted with SQLCipher
  □ No sensitive data in Redux/Zustand persist

NETWORK:
  □ Certificate pinning active
  □ TLS 1.2 minimum (prefer 1.3)
  □ No HTTP endpoints
  □ HSTS header on all responses

ENCRYPTION:
  □ AES-256-GCM (not ECB, not CBC without auth tag)
  □ Unique IV/nonce per encryption operation
  □ Keys never serialized to AsyncStorage
  □ No hardcoded secrets

DEPENDENCIES:
  □ npm audit — 0 critical vulnerabilities
  □ No packages with known CVEs (check snyk)
  □ Dependencies pinned with lockfile

OUTPUT FORMAT FOR FINDINGS:
  SEVERITY: [CRITICAL / HIGH / MEDIUM / LOW / INFO]
  FILE: path/to/file.ts:line_number
  ISSUE: description
  OWASP: M-number reference
  FIX: exact code change required
"""

auditor_agent = Agent(
    name="auditor_agent",
    model="gemini-2.0-flash",
    description="Reviews code for security vulnerabilities using OWASP Mobile Top 10 checklist.",
    instruction=AUDITOR_PROMPT,
    tools=[read_file, list_files, run_command],
)
```

---

## Sub-Agent 3: Threat Model

```python
# sub_agents/security/threat_model.py

from google.adk.agents import Agent
from tools.file_tools import write_file

THREAT_MODEL_PROMPT = """
You are a threat modeling expert using the STRIDE methodology.

For any component or feature described to you, produce a complete threat model:

STRIDE ANALYSIS:
  S - Spoofing Identity
  T - Tampering with data
  R - Repudiation (deny action)
  I - Information Disclosure
  D - Denial of Service
  E - Elevation of Privilege

OUTPUT FORMAT:
  ## Component: [Name]
  ## Attack Surface: [What can attackers reach]

  | Threat | STRIDE | Likelihood | Impact | Mitigation | Status |
  |--------|--------|------------|--------|-----------|--------|
  | ...    | ...    | High/Med/Low | High/Med/Low | ... | Implemented/TODO |

  ## Data Flow Security:
  [Diagram of data flows with trust boundaries]

  ## Security Controls:
  [List all controls that must exist]

  ## Residual Risk:
  [What risks remain after mitigations]

COMPONENTS YOU WILL MODEL:
- User registration + OTP flow
- Message encryption + transmission
- Key exchange (X3DH)
- File upload + storage
- WebRTC call establishment
- JWT authentication flow
- Group messaging (Sender Keys)
- Push notification pipeline
"""

threat_model_agent = Agent(
    name="threat_model_agent",
    model="gemini-2.0-flash",
    description="Produces STRIDE threat models for chat app components, identifying attack surfaces and mitigations.",
    instruction=THREAT_MODEL_PROMPT,
    tools=[write_file],
)
```

---

## 🛠️ Tools Used by Security Agent

```python
# tools/file_tools.py (used by all agents)

import os
from google.adk.tools import FunctionTool

def read_file(path: str) -> str:
    """Read a file from the project directory."""
    full_path = os.path.join(os.getenv("PROJECT_ROOT", "."), path)
    with open(full_path, "r") as f:
        return f.read()

def write_file(path: str, content: str) -> str:
    """Write content to a file in the project directory."""
    full_path = os.path.join(os.getenv("PROJECT_ROOT", "."), path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
    return f"Written: {path}"

def list_files(directory: str = ".") -> list[str]:
    """List all files in a directory."""
    full_path = os.path.join(os.getenv("PROJECT_ROOT", "."), directory)
    result = []
    for root, dirs, files in os.walk(full_path):
        # Skip node_modules and .git
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__']]
        for file in files:
            rel_path = os.path.relpath(os.path.join(root, file), full_path)
            result.append(rel_path)
    return result

read_file_tool = FunctionTool(read_file)
write_file_tool = FunctionTool(write_file)
list_files_tool = FunctionTool(list_files)
```

---

## 📋 Example Tasks for This Agent

```
# Via orchestrator or direct:

"Generate the complete X3DH key exchange implementation in TypeScript"
"Review src/services/auth.ts for security vulnerabilities"
"Build a threat model for the message encryption flow"
"Write key rotation logic for Signed Pre-Keys (weekly rotation)"
"Check our JWT implementation against OWASP guidelines"
"Generate safety numbers for key verification between two users"
"Implement certificate pinning for our React Native app"
"Audit our file upload handler for security issues"
```

---

## 📤 Sample Output

When asked: *"Generate X3DH key bundle generation code"*

The agent produces:
```typescript
// src/services/crypto/keyManagement.ts
import sodium from '@exodus/react-native-sodium';
import * as Keychain from 'react-native-keychain';

export interface KeyBundle {
  identityKey: KeyPair;       // IK — long-term identity
  signedPreKey: SignedKeyPair; // SPK — medium-term, signed weekly
  oneTimePreKeys: KeyPair[];   // OTPKs — single use, 50 generated
  registrationId: number;      // unique device identifier
}

export interface KeyPair {
  keyId: number;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/**
 * Generate complete pre-key bundle for a new user device.
 * Called ONCE on first registration. Private keys NEVER leave device.
 */
export async function generateKeyBundle(): Promise<KeyBundle> {
  // 1. Identity Key — permanent, proves who you are
  const identityKey = await generateX25519KeyPair(0);

  // 2. Signed Pre-Key — signed with identity key, rotated weekly
  const signedPreKey = await generateSignedPreKey(identityKey, 1);

  // 3. One-Time Pre-Keys — 50 ephemeral keys for first messages
  const oneTimePreKeys = await Promise.all(
    Array.from({ length: 50 }, (_, i) => generateX25519KeyPair(i + 1))
  );

  // 4. Store ALL private keys in hardware-backed Keychain
  await storePrivateKeys({ identityKey, signedPreKey, oneTimePreKeys });

  const registrationId = Math.floor(Math.random() * 16380) + 1;

  return { identityKey, signedPreKey, oneTimePreKeys, registrationId };
}

// ... (full 200-line implementation)
```
