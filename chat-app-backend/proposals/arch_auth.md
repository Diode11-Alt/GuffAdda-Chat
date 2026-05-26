# Authentication Microservice Extraction Proposal

## 1. Executive Summary
This document proposes the extraction of the authentication and authorization logic from the monolithic Fastify backend into an independent, scalable **Authentication Microservice**. This will decouple user identity management from the core messaging functionality, enabling independent scaling, improved security, and clear separation of concerns.

## 2. Current Architecture vs. Proposed Architecture

### Current State
Currently, the application is a monolithic Fastify server (`server.ts`) where authentication is tightly coupled:
- **Routes:** `/api/auth/register`, `/api/auth/login`, `/api/auth/request-otp`, `/api/auth/verify-otp` are handled directly in the core API.
- **Service Layer:** `AuthService` handles database insertions, bcrypt password hashing, and token generation within the same process.
- **Middleware:** `auth.middleware.ts` decodes JWTs directly inside the core application.
- **Data Store:** The `users` table, including `password_hash`, exists in the same PostgreSQL database as chat data (`conversations`, `messages`). Redis is used for OTPs and rate limiting.

### Proposed State
- **Auth Microservice:** A standalone service responsible for identity, credential verification, registration, and issuing/refreshing JWTs.
- **Core Chat Microservice:** The existing Fastify backend, stripped of authentication issuance logic, focusing strictly on WebSocket/REST messaging, user presence, and media.
- **API Gateway (Optional but Recommended):** A reverse proxy (e.g., Nginx, Traefik, or an API Gateway) routing `/api/auth/*` traffic to the Auth Service and `/api/*` traffic to the Core Service.
- **Data Separation:** The Auth Service will own the credentials schema/database.

## 3. Boundaries & Responsibilities

**Auth Service Responsibilities:**
- User registration and credential management (hashing).
- Authenticating users (Login via Email/Password, OTP).
- Issuing and refreshing Access Tokens (JWT) and Refresh Tokens.
- Password resets and OTP management.

**Core Chat Service Responsibilities:**
- Verifying incoming JWTs (stateless authentication via public/private key pairs or shared secret).
- Storing User Profile information (e.g., `displayName`, `avatar`) mapped to the `userId` provided by the JWT.
- Handling conversations, messages, sockets, and push notifications.

## 4. Communication & Integration Patterns

1. **Token Verification:**
   - **Shared Secret / Asymmetric Keys:** The Auth Service signs the JWT. The Core Chat Service only needs the JWT secret (or public key) to verify tokens in `auth.middleware.ts` without making a network call to the Auth Service.
2. **User Profile Syncing (Event-Driven or Synchronous):**
   - When a new user registers in the Auth Service, it must inform the Core Chat Service so it can create a user profile for messaging purposes.
   - **Option A (Message Broker):** Auth Service publishes a `UserRegistered` event to a message broker (e.g., RabbitMQ, Kafka, or Redis Pub/Sub). The Core Chat Service consumes it and creates a profile record.
   - **Option B (Synchronous gRPC/HTTP):** Auth Service makes an internal HTTP/gRPC call to the Core Chat Service to provision the profile during the registration flow. (Option A is preferred for resilience).

## 5. Database Strategy

To achieve true microservice isolation:
- **Auth Database:** Stores `id`, `email`, `password_hash`, `otp_secrets`, etc.
- **Core Database:** Stores `id`, `display_name`, `identity_public_key`, `signed_prekey_public`, `conversations`, `messages`, etc.

*Note: The `users` table currently holds both authentication (`password_hash`, `email`) and chat cryptography identity details (`identity_public_key`, `signed_prekey_public`). These fields will be split between the two services.*

## 6. Migration Strategy

### Phase 1: Modularization (Within Monolith)
- Refactor the database schema to split the `users` table into `auth_credentials` and `user_profiles`.
- Keep both running in the current Fastify application, but strictly decouple the service layers. Ensure `AuthService` does not directly query chat tables.

### Phase 2: Stand Up the Auth Service
- Create a new project repository/folder (`chat-app-auth-service`).
- Port `auth.routes.ts`, `auth.service.ts`, and OTP Redis logic to the new service.
- Configure the API Gateway to route `/api/auth` traffic to the new service.

### Phase 3: Service Communication & Cleanup
- Implement the User Sync mechanism (e.g., Redis Pub/Sub) for when users register.
- Update the Core Chat Service to rely solely on the JWT verification middleware and remove bcrypt, OTP generation, and credential routes.
- Drop the credentials columns from the Core Service's database.

## 7. Pros and Cons

**Pros:**
- **Security:** Password hashes and sensitive PII are isolated in a highly secured microservice. If the chat service is compromised, credentials are not exposed.
- **Scalability:** The chat service (WebSocket heavy) and auth service (CPU heavy for bcrypt hashing) can be scaled independently.
- **Maintainability:** Clearer domain boundaries.

**Cons:**
- **Operational Complexity:** Managing two services, an API Gateway, and inter-service communication (or event brokers).
- **Data Duplication/Consistency:** Must ensure the `userId` maps correctly between the Auth database and the Core Profile database, handling distributed transaction failures (e.g., what if auth succeeds but profile creation fails?).
