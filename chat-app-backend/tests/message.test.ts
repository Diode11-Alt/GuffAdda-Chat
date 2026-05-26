import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import messageRoutes from '../src/routes/message.routes';
import { MessageService } from '../src/services/message.service';
import { ConversationService } from '../src/services/conversation.service';

vi.mock('../src/services/message.service', () => {
  return {
    MessageService: {
      search: vi.fn(),
      getHistory: vi.fn(),
      deleteMessage: vi.fn(),
      editMessage: vi.fn(),
      setPinned: vi.fn(),
    },
  };
});

vi.mock('../src/services/conversation.service', () => {
  return {
    ConversationService: {
      isMember: vi.fn(),
    },
  };
});

describe('Message Routes - Encrypted Payloads Logic', () => {
  let app: ReturnType<typeof Fastify>;
  const JWT_SECRET = 'supersecret';
  const MOCK_USER_ID = 'user123';
  let token: string;

  beforeAll(async () => {
    token = jwt.sign({ userId: MOCK_USER_ID }, JWT_SECRET);

    app = Fastify();
    
    // Register the routes under /messages
    app.register(messageRoutes, { prefix: '/messages' });
    await app.ready();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search for messages with encrypted payloads', async () => {
    // Mock the search response
    const mockSearchResults = [
      { id: 'msg1', encrypted_payload: 'encrypted_search_result_1' }
    ];
    vi.mocked(MessageService.search).mockResolvedValue(mockSearchResults as any);

    const response = await app.inject({
      method: 'GET',
      url: '/messages/search?q=testQuery',
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(mockSearchResults);
    expect(MessageService.search).toHaveBeenCalledWith(MOCK_USER_ID, 'testQuery', 20);
  });

  it('should return 400 when editing a message with empty encrypted payload (content)', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/messages/msg1',
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        content: ''
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'Content is required' });
    expect(MessageService.editMessage).not.toHaveBeenCalled();
  });

  it('should edit a message and update its encrypted payload', async () => {
    const encryptedPayload = 'some-new-encrypted-data';
    const mockUpdatedMessage = { id: 'msg1', encrypted_payload: encryptedPayload };
    
    vi.mocked(MessageService.editMessage).mockResolvedValue(mockUpdatedMessage as any);

    const response = await app.inject({
      method: 'PUT',
      url: '/messages/msg1',
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        content: encryptedPayload
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(mockUpdatedMessage);
    expect(MessageService.editMessage).toHaveBeenCalledWith('msg1', MOCK_USER_ID, encryptedPayload);
  });

  it('should return 403 when trying to edit a message that belongs to someone else (or not found)', async () => {
    const encryptedPayload = 'hacker-encrypted-data';
    vi.mocked(MessageService.editMessage).mockResolvedValue(undefined as any);

    const response = await app.inject({
      method: 'PUT',
      url: '/messages/msg1',
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        content: encryptedPayload
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'Not authorized or message not found' });
    expect(MessageService.editMessage).toHaveBeenCalledWith('msg1', MOCK_USER_ID, encryptedPayload);
  });

  it('should get message history with encrypted payloads for a conversation', async () => {
    const mockHistory = {
      messages: [{ id: 'msg1', encrypted_payload: 'enc1' }],
      hasMore: false
    };

    vi.mocked(ConversationService.isMember).mockResolvedValue(true);
    vi.mocked(MessageService.getHistory).mockResolvedValue(mockHistory as any);

    const response = await app.inject({
      method: 'GET',
      url: '/messages/conv123',
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(mockHistory);
    expect(ConversationService.isMember).toHaveBeenCalledWith('conv123', MOCK_USER_ID);
    expect(MessageService.getHistory).toHaveBeenCalledWith('conv123', MOCK_USER_ID, { limit: 50, before: undefined });
  });

  it('should return 403 when getting history for a conversation the user is not part of', async () => {
    vi.mocked(ConversationService.isMember).mockResolvedValue(false);

    const response = await app.inject({
      method: 'GET',
      url: '/messages/conv123',
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'Not a member of this conversation' });
    expect(MessageService.getHistory).not.toHaveBeenCalled();
  });
});
