import type { Express } from "express";
import { storage } from "./storage";

function isAdmin(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction,
) {
  const user = req.session?.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // For now, let's make user with ID 1 the admin
  if (user.id !== 1) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
}

export function registerAdminRoutes(app: Express) {
  // Get pending transactions
  app.get("/api/admin/transactions/pending", async (req, res) => {
    try {
      const transactions = await storage.getPendingTransactions();
      res.json(transactions);
    } catch (err) {
      console.error("Error fetching pending transactions:", err);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Approve transaction
  app.post("/api/admin/transactions/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await storage.getTransaction(parseInt(id));

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Update transaction status
      const updatedTransaction = await storage.updateTransaction(parseInt(id), {
        status: "Completed",
      });

      // Handle balance updates based on transaction type
      const user = await storage.getUser(transaction.userId);
      if (user) {
        if (transaction.type === "Deposit") {
          // Update user's balance for approved deposit
          await storage.updateUser(user.id, {
            totalAssets: (
              parseFloat(user.totalAssets.toString()) +
              parseFloat(transaction.amount.toString())
            ).toString(),
            rechargeAmount: (
              parseFloat(user.rechargeAmount.toString()) +
              parseFloat(transaction.amount.toString())
            ).toString(),
          });

          // Process first deposit bonus if applicable
          const existingDeposits = await storage.getTransactionsByUserId(
            user.id,
          );
          const completedDeposits = existingDeposits.filter(
            (t) =>
              t.type === "Deposit" &&
              t.status === "Completed" &&
              t.id !== transaction.id,
          );

          if (completedDeposits.length === 0) {
            // This is the first deposit, add 10% bonus
            const bonusAmount = parseFloat(transaction.amount.toString()) * 0.1;

            await storage.updateUser(user.id, {
              totalAssets: (
                parseFloat(user.totalAssets.toString()) + bonusAmount
              ).toString(),
            });

            // Create bonus transaction
            await storage.createTransaction({
              userId: user.id,
              type: "Bonus",
              amount: bonusAmount.toString(),
              status: "Completed",
              txHash: null,
            });
          }
        }
      }

      res.json(updatedTransaction);
    } catch (err) {
      console.error("Error approving transaction:", err);
      res.status(500).json({ message: "Failed to approve transaction" });
    }
  });

  // Reject transaction
  app.post("/api/admin/transactions/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedTransaction = await storage.updateTransaction(parseInt(id), {
        status: "Failed",
      });
      res.json(updatedTransaction);
    } catch (err) {
      console.error("Error rejecting transaction:", err);
      res.status(500).json({ message: "Failed to reject transaction" });
    }
  });
}
