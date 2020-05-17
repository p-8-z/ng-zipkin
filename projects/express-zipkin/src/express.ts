const express = require('express');
const morgan = require('morgan');
const {BatchRecorder, ExplicitContext, jsonEncoder, Tracer} = require('zipkin');
const {expressMiddleware} = require('zipkin-instrumentation-express');
const {HttpLogger} = require('zipkin-transport-http');

const tracer = new Tracer({
  ctxImpl: new ExplicitContext(),
  recorder: new BatchRecorder({
    logger: new HttpLogger({
      endpoint: 'http://localhost:9411/api/v2/spans',
      jsonEncoder: jsonEncoder.JSON_V2,
    }),
  }),
  localServiceName: 'express-zipkin',
});

const app = express();
const port = process.env.PORT || 3000;

// Add the Zipkin middleware
app.use(expressMiddleware({tracer}));

app.use(morgan('dev'));

app.get('/api/names', (req, res, _) => {
  res.json(['Tony', 'Lisa', 'Michael', 'Ginger', 'Food']);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
