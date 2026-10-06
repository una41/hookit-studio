import express, { type Request, type Response, type ErrorRequestHandler } from 'express';
export function createHttpServer(
  api: express.Express,
  webhook: (req: Request & { rawBody?: Buffer }, res: Response) => Promise<void>,
  isReady: () => boolean,
) {
  const server = express();
  server.disable('x-powered-by');
  server.get('/healthz', (_req, res) => {
    res.status(isReady() ? 200 : 503).json({ ready: isReady() });
  });
  server.all(
    '/webhooks/instagram',
    express.json({
      limit: '256kb',
      verify(req, _res, buffer) {
        (req as Request & { rawBody?: Buffer }).rawBody = buffer;
      },
    }),
    (req, res, next) => {
      void webhook(req, res).catch(next);
    },
  );
  server.use('/api', api);
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    const status =
      error?.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 503;
    res.status(status).json({ error: '요청을 처리하지 못했어요.' });
  };
  server.use(errorHandler);

  return server;
}
