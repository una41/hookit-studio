import express from 'express';
import { createServer } from 'node:http';
import { handleAsNodeRequest } from 'cloudflare:node';
import { app } from './core/api.js';
import { receiveWebhook } from './core/webhook.js';
const router = express();
router.disable('x-powered-by');
router.all(
  '/webhooks/instagram',
  express.json({
    limit: '256kb',
    verify(req, res, buffer) {
      req.rawBody = buffer;
    },
  }),
  (req, res, next) => {
    void receiveWebhook(req, res).catch(next);
  },
);
router.use('/api', app);
router.use((error, req, res, next) => {
  res
    .status(error.type === 'entity.too.large' ? 413 : 400)
    .json({ error: '요청을 처리하지 못했어요.' });
});
createServer(router).listen(8788);
export function backend(request) {
  return handleAsNodeRequest(8788, request);
}
