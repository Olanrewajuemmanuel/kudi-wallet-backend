import cron from "cron";
import https from "https";

// Define a cron job that runs every 14 minutes
const cronJob = cron.schedule("*/14 * * * *", async () => {
    https.get(process.env.API_URL + "/health");
    console.log("--- Running cron job ---");
});

export default cronJob;