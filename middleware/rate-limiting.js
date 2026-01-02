import ratelimiter from "../config/upstash.js";

const limiter = async (req, res, next) => {
  try {
    const success = await ratelimiter.limit({
      identifier: req.ip,
    });
    if (!success.success) {
      return res.status(429).json({ message: "Too many requests" });
    }
    next();
  } catch (error) {
    console.error("Rate limting error: ", error);
    next(error);
  }
};

export default limiter;