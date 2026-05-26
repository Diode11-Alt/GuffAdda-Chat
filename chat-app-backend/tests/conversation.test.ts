import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import conversationRoutes from '../src/routes/conversation.routes';
import { ConversationService } from '../src/services/conversation.service';

// Mock the ConversationService
vi.mock('../src/services/conversation.service', () => {
  return {
    ConversationService: {
      create: vi.fn(),
      listForUser: vi.fn(),
      isMember: vi.fn(),
      getById: vi.fn(),
      markAsRead: vi.fn(),
      updateGroupInfo: vi.fn(),
      addMembers: vi.fn(),
      removeMember: vi.fn(),
    },
  };
});

// Mock Sentry to avoid unhandled exception logging
vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}));

describe('Conversation Routes - Creation', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
  let app: ReturnType<typeof Fastify>;
  let validToken: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    app = Fastify();
    app.register(conversationRoutes, { prefix: '/api/conversations' });
    await app.ready();

    validToken = jwt.sign({ userId: 'user-1' }, JWT_SECRET, { expiresIn: '1h' });
  });

  it('should create a 1-on-1 (direct) conversation', async () => {
    const mockConversation = { id: 'conv-1', type: 'direct', members: [] };
    vi.mocked(ConversationService.create).mockResolvedValue(mockConversation as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/conversations',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
      payload: {
        type: 'direct',
        memberIds: ['user-2'],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ conversation: mockConversation });
    expect(ConversationService.create).toHaveBeenCalledWith('user-1', 'direct', ['user-2'], undefined);
  });

  it('should create a group conversation', async () => {
    const mockConversation = { id: 'conv-2', type: 'group', name: 'My Group', members: [] };
    vi.mocked(ConversationService.create).mockResolvedValue(mockConversation as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/conversations',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
      payload: {
        type: 'group',
        name: 'My Group',
        memberIds: ['user-2', 'user-3'],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ conversation: mockConversation });
    expect(ConversationService.create).toHaveBeenCalledWith('user-1', 'group', ['user-2', 'user-3'], 'My Group');
  });

  it('should return 400 when missing memberIds', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/conversations',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
      payload: {
        type: 'direct',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'type and memberIds are required' });
  });

  it('should return 400 when memberIds array is empty', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/conversations',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
      payload: {
        type: 'direct',
        memberIds: [],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'type and memberIds are required' });
  });

  it('should return 400 when direct conversation has more than one other member', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/conversations',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
      payload: {
        type: 'direct',
        memberIds: ['user-2', 'user-3'],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'Direct conversations require exactly one other member' });
  });

  it('should return 500 when ConversationService throws an error', async () => {
    vi.mocked(ConversationService.create).mockRejectedValue(new Error('DB Error'));

    const response = await app.inject({
      method: 'POST',
      url: '/api/conversations',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
      payload: {
        type: 'direct',
        memberIds: ['user-2'],
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: 'Internal Server Error' });
  });
});
