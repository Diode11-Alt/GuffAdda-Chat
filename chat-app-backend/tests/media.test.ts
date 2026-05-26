import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import mediaRoutes from '../src/routes/media.routes';
import { MediaService } from '../src/services/media.service';

// Mock the auth middleware so we can test the route without generating actual JWTs
vi.mock('../src/middleware/auth.middleware', () => ({
  verifyToken: async (request: any, reply: any) => {
    // Just mock it to pass without error
    return;
  }
}));

// Mock the MediaService to avoid writing actual files to disk
vi.mock('../src/services/media.service', () => ({
  MediaService: {
    saveFile: vi.fn(),
    init: vi.fn()
  }
}));

describe('Media Routes', () => {
  let fastify: ReturnType<typeof Fastify>;

  beforeEach(() => {
    fastify = Fastify();
    fastify.register(fastifyMultipart);
    fastify.register(mediaRoutes, { prefix: '/api/media' });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fastify.close();
  });

  it('should return 400 if no file is uploaded', async () => {
    const FormData = require('form-data');
    const form = new FormData();

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/media/upload',
      headers: {
        authorization: 'Bearer fake-token',
        ...form.getHeaders()
      },
      payload: form
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.payload)).toEqual({
      error: 'No file uploaded'
    });
  });

  it('should successfully upload a file and return 201', async () => {
    const mockFileResult = {
      id: 'mock-id.png',
      url: '/uploads/mock-id.png',
      size: 1234,
      type: 'image/png'
    };

    // Make the mocked saveFile return our mock result
    vi.mocked(MediaService.saveFile).mockResolvedValue(mockFileResult);

    // Create a mock multipart form data payload
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', Buffer.from('fake image content'), {
      filename: 'test.png',
      contentType: 'image/png',
    });

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/media/upload',
      headers: {
        authorization: 'Bearer fake-token',
        ...form.getHeaders()
      },
      payload: form
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.payload)).toEqual(mockFileResult);
    expect(MediaService.saveFile).toHaveBeenCalledTimes(1);
  });

  it('should return 500 if an error occurs during upload', async () => {
    vi.mocked(MediaService.saveFile).mockRejectedValue(new Error('Internal error'));

    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', Buffer.from('fake image content'), {
      filename: 'test.png',
      contentType: 'image/png',
    });

    const response = await fastify.inject({
      method: 'POST',
      url: '/api/media/upload',
      headers: {
        authorization: 'Bearer fake-token',
        ...form.getHeaders()
      },
      payload: form
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.payload)).toEqual({
      error: 'Failed to upload media'
    });
  });
});
