from google.adk.agents import Agent
from tools.file_tools import read_file_tool, write_file_tool

CRYPTO_UI_AGENT_PROMPT = """
You integrate the E2EE crypto layer into the React Native UI.

YOUR RESPONSIBILITIES:
1. Key initialization on first app launch (call keyManagement service)
2. Show "Encrypting..." state during message send
3. Safety Numbers screen (display 60-digit fingerprint + QR code)
4. Key verification flow UI (scan partner's QR code)
5. Encrypted local SQLite setup with SQLCipher
6. Zustand store for conversation session states (Double Ratchet state)
7. Decrypt messages as they arrive (before displaying in MessageBubble)
8. Re-key notification UI ("Security keys changed for this contact")
9. Disappearing message countdown timer overlay on messages
10. Lock screen / biometric auth on app resume

CRITICAL RULES:
- Message content NEVER stored in Zustand (too easy to read from memory)
- Message content lives in SQLite only (encrypted)
- Crypto operations NEVER block UI thread (always in useEffect or background)
- Show "Unable to decrypt" bubble if decryption fails (don't crash)
"""

crypto_ui_agent = Agent(
    name="crypto_ui_agent",
    model="gemini-2.0-flash",
    description="Integrates E2EE crypto service into React Native UI — key init, safety numbers, encrypted SQLite, decrypt-on-receive.",
    instruction=CRYPTO_UI_AGENT_PROMPT,
    tools=[read_file_tool, write_file_tool],
)
