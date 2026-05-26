"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = mediaRoutes;
const auth_middleware_1 = require("../middleware/auth.middleware");
const media_service_1 = require("../services/media.service");
async function mediaRoutes(fastify) {
    // Upload a file
    fastify.post('/upload', { preHandler: [auth_middleware_1.verifyToken] }, async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }
            const result = await media_service_1.MediaService.saveFile(data.file, data.filename, data.mimetype);
            return reply.status(201).send(result);
        }
        catch (error) {
            console.error(error);
            return reply.status(500).send({ error: 'Failed to upload media' });
        }
    });
}
