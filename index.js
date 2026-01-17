import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import responseTime from "response-time";
import { sql } from "./config/db.js";
import limiter from "./middleware/rate-limiting.js";
import transactionsRouter from "./routes/transactions.js";
import cronJob from "./cron/index.js";
import { restResponseTimeHistogram, startMetricServer } from "./metrics.js";

dotenv.config();
const app = express();
const inProduction = process.env.NODE_ENV === "production";

if (inProduction) {
  cronJob.start();
}
app.use(limiter);
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(morgan(`${inProduction ? "tiny" : "dev"}`));
app.use(express.json());
app.use(
  responseTime((req, res, time) => {
    if (req?.route?.path) {
      restResponseTimeHistogram.observe(
        {
          method: req.method,
          route: req.route.path,
          status_code: res.statusCode,
        },
        time / 1000,
      );
    }
  }),
);
app.use("/api/transactions", transactionsRouter);
app.use((req, res, next, err) => {
  console.log(err.stack, err.message);
});

initializeServer(app);
initializeDatabase();

app.get("/health", (_, res) => {
  return res.end("ok");
});

function initializeServer(app) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  // Start metrics server
  startMetricServer();
}

async function initializeDatabase() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL NOT NULL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            amount DECIMAL(20, 2) NOT NULL,
            category VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
    console.log("--- Database connection successful ---");
  } catch (error) {
    console.error("--- Database connection error ---", error);
  }
}
