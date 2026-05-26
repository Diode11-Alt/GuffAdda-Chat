# Horizontal Scaling Architecture for WebRTC Signaling (Socket.IO + Redis)

## 1. Current Limitations

Currently, the WebSocket signaling logic in `src/socket/chatHandlers.ts` relies on two main mechanisms that prevent horizontal scaling:

1. **In-Memory Tracking**: Online user connections are tracked using an in-memory `Map<string, Set<string>>` (`onlineUsers`). If multiple Node.js instances are running, they won't share this map. Users connected to Node A will appear offline to users connected to Node B.
2. **Local Pub/Sub**: The `io.to(roomId).emit()` calls for WebRTC signaling (`call_initiate`, `ice_candidate`, etc.) only broadcast to sockets connected to the *current* Node.js instance. If the caller is on Node A and the callee is on Node B, they will not receive the signaling payloads.

## 2. Proposed Architecture

To allow horizontal scaling across multiple instances (e.g., in a Kubernetes cluster or multiple Docker containers), we need to centralize message passing and state management using **Redis**.

### Components:
1. **Redis Pub/Sub (Socket.IO Adapter)**: Replaces the default in-memory adapter. This ensures that an `emit` to a room on Node A is automatically published to Redis and forwarded to the corresponding sockets on Node B, Node C, etc.
2. **Redis Key-Value Store (Presence State)**: Replaces the local `onlineUsers` Map with Redis Sets/Hashes to maintain global online status.

## 3. Implementation Steps

### Step 1: Install Dependencies
```bash
npm install @socket.io/redis-adapter redis
npm install --save-dev @types/redis
```

### Step 2: Configure Redis Adapter in `server.ts`
We need to attach the Redis adapter to the Socket.IO server initialization.

```typescript
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

// Create pub/sub clients
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

// Configure Socket.IO
import fastifySocketIo from 'fastify-socket.io';
server.register(fastifySocketIo, {
  adapter: createAdapter(pubClient, subClient)
});
```

### Step 3: Refactor User Presence State
Replace the local `onlineUsers` Map with Redis sets.

* **On Connect**:
  ```typescript
  // Add socketId to the user's Redis Set
  await redisClient.sAdd(`user_sockets:${userId}`, socket.id);
  
  // Optionally, track globally that the user is online
  await redisClient.sAdd('online_users', userId);
  ```

* **On Disconnect**:
  ```typescript
  await redisClient.sRem(`user_sockets:${userId}`, socket.id);
  const remainingSockets = await redisClient.scard(`user_sockets:${userId}`);
  
  if (remainingSockets === 0) {
    await redisClient.sRem('online_users', userId);
    // Broadcast user offline
  }
  ```

* **`isUserOnline` helper**:
  ```typescript
  export const isUserOnline = async (userId: string): Promise<boolean> => {
    const count = await redisClient.scard(`user_sockets:${userId}`);
    return count > 0;
  };
  ```

### Step 4: WebRTC Signaling Adjustments
Thanks to the `@socket.io/redis-adapter`, the WebRTC signaling logic **does not need to change**. 

Events like `socket.to(data.conversationId).emit('call_incoming', ...)` will naturally be propagated to all servers by the Redis adapter. All connected clients in `data.conversationId` (regardless of which Node instance they are attached to) will receive the signaling payloads correctly.

## 4. Considerations & Next Steps

- **Redis Reliability**: The Redis instance becomes a critical infrastructure component. It should be configured with persistence or in a highly available setup (Redis Sentinel or Cluster).
- **Sticky Sessions**: Even with the Redis adapter, if you are using long-polling as a fallback for WebSockets, your load balancer must be configured with sticky sessions (IP Hash or Session Cookies) to ensure multi-step HTTP requests reach the same Node instance.
- **Connection Cleanup**: If a Node instance crashes, it might not properly run the `disconnect` handlers to clean up Redis state. A periodic heartbeat or TTL (Time-To-Live) on the Redis keys should be implemented to evict stale user sessions.
