export function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  if (status >= 500) console.error(JSON.stringify({ event: 'request_failed', type: error.code || error.name }));
  const message = status >= 500
    ? 'Service unavailable; please try again'
    : error.type === 'entity.parse.failed' ? 'Malformed JSON body' : error.message;
  res.status(status).json({ error: { message } });
}
