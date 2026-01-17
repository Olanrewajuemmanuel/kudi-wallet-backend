import express from "express";
import client from "prom-client";

const app = express();

export function startMetricServer() {
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics();

  app.get("/metrics", async (req, res) => {
    res.setHeader("Content-Type", client.register.contentType);
    return res.send(await client.register.metrics());
  });

  app.listen(9001, () => {
    console.log(`Metrics started at localhost://9001`);
  });
}

export const restResponseTimeHistogram = new client.Histogram({
  name: "rest_response_time_duration_seconds",
  help: "Rest API response time in secs",
  labelNames: ["method", "route", "status_code"],
  registers: [client.register]
});

export const databaseResponseTimeHistogram = new client.Histogram({
    name: 'db_response_time_duration_seconds',
    help: 'Database response time in seconds',
    labelNames: ['operation', 'success'],
    registers: [client.register]
});
