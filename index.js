const express=require("express")
const {open}=require("sqlite")
const sqlite3=require("sqlite3")
const path=require("path")


const dbPath = path.join(__dirname, "finance.db");
const app=express()
app.use(express.json())

let db = null;
const initializeDBAndServer = async () => {
    try {
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });
      app.listen(3001, () => {
        console.log("Server Running at http://localhost:3001/");
      });
    } catch (e) {
      console.log(`DB Error: ${e.message}`);
      process.exit(1);
    }
  };
  
  initializeDBAndServer();


  //API Endpoints


// POST /transactions: Adds a new transaction (income or expense)
app.post("/transactions", async (req, res) => {
    const { type, category, amount, date, description } = req.body;
    const createTransactionQuery = `
        INSERT INTO transactions (type, category, amount, date, description)
        VALUES ('${type}', ${category}, ${amount}, '${date}', '${description}');
    `;
    await db.run(createTransactionQuery);
    res.send("Transaction added successfully");
});


  // GET /transactions: Retrieves all transactions
app.get("/transactions", async (req, res) => {
    const getTransactionsQuery = `SELECT * FROM transactions;`;
    const transactions = await db.all(getTransactionsQuery);
    res.json(transactions);
});


// GET /transactions/:id: Retrieves a transaction by ID
app.get("/transactions/:id", async (req, res) => {
    const { id } = req.params;
    const getTransactionByIdQuery = `SELECT * FROM transactions WHERE id = ${id};`;
    const transaction = await db.get(getTransactionByIdQuery);
    res.json(transaction);
});

// PUT /transactions/:id: Updates a transaction by ID
app.put("/transactions/:id", async (req, res) => {
    const { id } = req.params;
    const { type, category, amount, date, description } = req.body;
    const updateTransactionQuery = `
        UPDATE transactions
        SET type = '${type}', category = ${category}, amount = ${amount}, date = '${date}', description = '${description}'
        WHERE id = ${id};
    `;
    await db.run(updateTransactionQuery);
    res.send("Transaction updated successfully");
});

// DELETE /transactions/:id: Deletes a transaction by ID
app.delete("/transactions/:id", async (req, res) => {
    const { id } = req.params;
    const deleteTransactionQuery = `DELETE FROM transactions WHERE id = ${id};`;
    await db.run(deleteTransactionQuery);
    res.send("Transaction deleted successfully");
});

// GET /summary: Retrieves a summary of transactions (total income, total expenses, and balance)
app.get("/summary", async (req, res) => {
    const { startDate, endDate, category } = req.query;
    let filterQuery = '';

    // Apply optional filters for date range and category
    if (startDate && endDate) {
        filterQuery += ` AND date BETWEEN '${startDate}' AND '${endDate}'`;
    }
    if (category) {
        filterQuery += ` AND category = ${category}`;
    }

    const incomeQuery = `SELECT SUM(amount) AS totalIncome FROM transactions WHERE type = 'income' ${filterQuery};`;
    const expenseQuery = `SELECT SUM(amount) AS totalExpenses FROM transactions WHERE type = 'expense' ${filterQuery};`;

    const incomeResult = await db.get(incomeQuery);
    const expenseResult = await db.get(expenseQuery);

    const totalIncome = incomeResult.totalIncome || 0;
    const totalExpenses = expenseResult.totalExpenses || 0;
    const balance = totalIncome - totalExpenses;

    res.json({
        totalIncome,
        totalExpenses,
        balance,
    });
});