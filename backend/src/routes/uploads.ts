import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { App } from "../index.js";

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/upload/video - Upload a video file
  fastify.post("/api/upload/video", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Uploading video');

    try {
      const data = await request.file({ limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit
      if (!data) {
        app.logger.warn({ userId: session.user.id }, 'No video file provided');
        return reply.status(400).send({ error: 'No video file provided' });
      }

      let buffer: Buffer;
      try {
        buffer = await data.toBuffer();
      } catch (err) {
        app.logger.error({ err, userId: session.user.id }, 'Video file too large');
        return reply.status(413).send({ error: 'Video file too large' });
      }

      const key = `uploads/videos/${Date.now()}-${data.filename}`;
      const uploadedKey = await app.storage.upload(key, buffer);
      const { url } = await app.storage.getSignedUrl(uploadedKey);

      app.logger.info({ userId: session.user.id, key: uploadedKey }, 'Video uploaded successfully');
      return { url, key: uploadedKey };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to upload video');
      throw error;
    }
  });

  // POST /api/upload/photo - Upload a photo file
  fastify.post("/api/upload/photo", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Uploading photo');

    try {
      const data = await request.file({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit
      if (!data) {
        app.logger.warn({ userId: session.user.id }, 'No photo file provided');
        return reply.status(400).send({ error: 'No photo file provided' });
      }

      let buffer: Buffer;
      try {
        buffer = await data.toBuffer();
      } catch (err) {
        app.logger.error({ err, userId: session.user.id }, 'Photo file too large');
        return reply.status(413).send({ error: 'Photo file too large' });
      }

      const key = `uploads/photos/${Date.now()}-${data.filename}`;
      const uploadedKey = await app.storage.upload(key, buffer);
      const { url } = await app.storage.getSignedUrl(uploadedKey);

      app.logger.info({ userId: session.user.id, key: uploadedKey }, 'Photo uploaded successfully');
      return { url, key: uploadedKey };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to upload photo');
      throw error;
    }
  });
}
