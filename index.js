import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { sql } from "./config/db.js";
import limiter from "./middleware/rate-limiting.js";
import transactionsRouter from "./routes/transactions.js";

dotenv.config();
const app = express();
const inProduction = process.env.NODE_ENV === 'production';

app.use(limiter);
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(morgan(`${inProduction ? "tiny" : "dev"}`))
app.use(express.json());
app.use("/api/transactions", transactionsRouter);
app.use((req, res, next, err) => {
    console.log(err.stack, err.message)
})

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
