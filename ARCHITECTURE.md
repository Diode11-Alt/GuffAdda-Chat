# Kura Kani Architecture

This document outlines the high-level architecture and security mechanisms of Kura Kani.

## E2EE Key Exchange Flow

The application employs End-to-End Encryption (E2EE) to ensure that messages can only be read by the intended recipients. The key exchange and encryption process relies on **libsodium** for cryptographic primitives.

### Simplified Key Exchange (X3DH / Double Ratchet)

1. **Key Generation**: Upon registration, each client generates a long-term Identity Key (Ed25519) and a set of One-Time Prekeys (Curve25519) using libsodium.
2. **Key Distribution**: The client uploads its public Identity Key and public Prekeys to the Fastify backend server. The private keys remain securely on the client device.
3. **Session Initiation**: When User A wants to message User B:
   - User A requests User B's public Identity Key and one of User B's public Prekeys from the backend server.
   - User A uses these public keys along with their own private keys to perform an Extended Triple Diffie-Hellman (X3DH) key agreement. This establishes a shared secret.
4. **Message Encryption**: The shared secret is used to initialize a Double Ratchet session, deriving symmetric keys (e.g., XSalsa20-Poly1305) for encrypting and decrypting messages. Each message ratchets the key forward, providing forward secrecy and post-compromise security.
5. **Message Transmission**: Encrypted payloads are sent to the Fastify backend, which routes them to the intended recipient via WebSockets. The backend cannot decrypt the payloads as it lacks the shared secret.

## Fastify Backend Role

The Fastify backend serves as a high-performance, asynchronous relay and signaling server. Its primary responsibilities include:

- **User Authentication**: Managing user registration, login, and JWT-based authentication.
- **Key Server**: Storing and distributing public Identity Keys and Prekeys.
- **Message Routing**: Facilitating real-time message delivery between clients via WebSockets (`@fastify/websocket`).
- **Offline Storage**: Temporarily holding encrypted messages for offline users until they reconnect.

*Note: The backend is entirely zero-knowledge regarding the plaintext contents of the messages.*
