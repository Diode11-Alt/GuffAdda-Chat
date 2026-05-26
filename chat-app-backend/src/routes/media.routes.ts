import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../middleware/auth.middleware';
import { MediaService } from '../services/media.service';

export default async function mediaRoutes(fastify: FastifyInstance) {
  // Upload a file
  fastify.post('/upload', { preHandler: [verifyToken] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      const result = await MediaService.saveFile(data.file, data.filename, data.mimetype);
      return reply.status(201).send(result);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Failed to upload media' });
    }
  });
}
