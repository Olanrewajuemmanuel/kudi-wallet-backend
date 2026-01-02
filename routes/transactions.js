import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { sql } from "../config/db.js";

const router = Router();
const validationQ = [
  body("title").isString().trim().notEmpty().withMessage("Title is required"),

  body("user_id").isString(),

  body("amount").isNumeric().withMessage("Amount must be a number"),

  body("category")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Category is required"),
];

router.get(
  "/:id",
  param("id").isString().withMessage("ID must be a string"),
  async (req, res) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).json(result.array());
      }
      const { id } = req.params;
      const transactions =
        await sql`SELECT * FROM transactions WHERE id = ${id}`;
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json(error);
    }
  }
);

router.delete(
  "/:id",
  param("id").isString().withMessage("ID must be a string"),
  async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json(result.array());
    }
    const { id } = req.params;
    const transaction = await sql`DELETE FROM transactions WHERE id = ${id}`;
    if (transaction.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    return res.status(204).end();
  }
);

router.post("/", validationQ, async (req, res) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json(result.array());
    }
    const { title, user_id, amount, category } = req.body;

    const transactions = await sql`
            INSERT INTO transactions(
            user_id, title, amount, category) VALUES (
            ${user_id}, ${title}, ${amount}, ${category})
            RETURNING *
        `;
    return res.status(201).json(transactions);
  } catch (error) {
    return res.status(500).json(error);
  }
});

router.get("/summaries/:user_id", param("user_id").isString().withMessage("User ID must be a string"), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }
        const { user_id } = req.params;
        const transactions = await sql`SELECT COALESCE(SUM(amount), 0) AS balance FROM transactions WHERE user_id = ${user_id}`;
        const incomeResult = await sql`SELECT COALESCE(SUM(amount), 0) AS income FROM transactions WHERE user_id = ${user_id} AND amount > 0`;
        const expenseResult = await sql`SELECT COALESCE(SUM(amount), 0) AS expense FROM transactions WHERE user_id = ${user_id} AND amount < 0`;
        return res.status(200).json({balance: transactions[0].balance, income: incomeResult[0].income, expense: expenseResult[0].expense});
    } catch (error) {
        return res.status(500).json(error);
    }
})

export default router;
