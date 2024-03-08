const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 5000;
const db = new sqlite3.Database("pancakeCafe.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to the pancakeCafe.db database.');
});

app.use(bodyParser.json());
app.use(cors());

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS PancakeBatches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      batchesMade INTEGER NOT NULL,
      eggsUsed INTEGER NOT NULL,
      flourUsed INTEGER NOT NULL,
      oilUsed INTEGER NOT NULL,
      milkUsed INTEGER NOT NULL
    );`
  );
});

app.post("/update-ingredients", (req, res) => {
  const { eggs, flour, oil, milk } = req.body;
  db.get(`SELECT * FROM Ingredients LIMIT 1`, [], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      const updatedEggs = (row.eggs || 0) + eggs;
      const updatedFlour = (row.flour || 0) + flour;
      const updatedOil = (row.oil || 0) + oil;
      const updatedMilk = (row.milk || 0) + milk;

      const updateQuery = `UPDATE Ingredients SET eggs = ?, flour = ?, oil = ?, milk = ? WHERE id = ?`;
      db.run(updateQuery, [updatedEggs, updatedFlour, updatedOil, updatedMilk, row.id], function(err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: "Ingredients updated successfully" });
      });
    } else {
  
      const insertQuery = `INSERT INTO Ingredients (eggs, flour, oil, milk) VALUES (?, ?, ?, ?)`;
      db.run(insertQuery, [eggs, flour, oil, milk], function(err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "Ingredients added successfully" });
      });
    }
  });
});

app.post("/add-pancakes", (req, res) => {
  const { date, batchesMade } = req.body;
  const eggsNeeded = 2 * batchesMade;
  const flourNeeded = 100 * batchesMade; 
  const oilNeeded = 15 * batchesMade; 
  const milkNeeded = 300 * batchesMade; 

  db.get(`SELECT * FROM Ingredients LIMIT 1`, [], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: err.message });
    }

    if (row && row.eggs >= eggsNeeded && row.flour >= flourNeeded && row.oil >= oilNeeded && row.milk >= milkNeeded) {
      const updateQuery = `UPDATE Ingredients SET eggs = eggs - ?, flour = flour - ?, oil = oil - ?, milk = milk - ? WHERE id = ?`;
      db.run(updateQuery, [eggsNeeded, flourNeeded, oilNeeded, milkNeeded, row.id], function(err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: err.message });
        }
        const insertBatchQuery = `INSERT INTO PancakeBatches (date, batchesMade, eggsUsed, flourUsed, oilUsed, milkUsed) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(insertBatchQuery, [date, batchesMade, eggsNeeded, flourNeeded, oilNeeded, milkNeeded], function(err) {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({ message: "Pancake batch added successfully and ingredients deducted" });
        });
      });
    } 
  });
});
app.delete("/delete-pancake-batch/:id", (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM PancakeBatches WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }

    db.run(`DELETE FROM PancakeBatches WHERE id = ?`, [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes > 0) {
        const updateIngredientsQuery = `UPDATE Ingredients SET
                                        eggs = eggs + ?,
                                        flour = flour + ?,
                                        oil = oil + ?,
                                        milk = milk + ?
                                        WHERE id = 1`;
        db.run(updateIngredientsQuery, [row.eggsUsed, row.flourUsed, row.oilUsed, row.milkUsed], (err) => {
          if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ message: "Batch deleted and ingredients returned to inventory" });
        });
      } else {
        res.status(404).send("Not found");
      }
    });
  });
});
app.put("/update-pancake-batch/:id", (req, res) => {
  const { id } = req.params;
  const { date, batchesMade } = req.body;

  db.get(`SELECT * FROM PancakeBatches WHERE id = ?`, [id], (err, oldBatch) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!oldBatch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const newEggsUsed = batchesMade * 2; 
    const newFlourUsed = batchesMade * 100; 
    const newOilUsed = batchesMade * 15;
    const newMilkUsed = batchesMade * 300; 

    const eggsUsedDiff = newEggsUsed - oldBatch.eggsUsed;
    const flourUsedDiff = newFlourUsed - oldBatch.flourUsed;
    const oilUsedDiff = newOilUsed - oldBatch.oilUsed;
    const milkUsedDiff = newMilkUsed - oldBatch.milkUsed;

    db.run(`UPDATE PancakeBatches SET date = ?, batchesMade = ?, eggsUsed = ?, flourUsed = ?, oilUsed = ?, milkUsed = ? WHERE id = ?`,
           [date, batchesMade, newEggsUsed, newFlourUsed, newOilUsed, newMilkUsed, id], function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: err.message });
      }

      db.run(`UPDATE Ingredients SET eggs = eggs - ?, flour = flour - ?, oil = oil - ?, milk = milk - ? WHERE id = 1`,
             [eggsUsedDiff, flourUsedDiff, oilUsedDiff, milkUsedDiff], (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Batch updated successfully, ingredients recalculated and inventory adjusted." });
      });
    });
  });
});


app.get("/ingredients", (req, res) => {
  db.all(`SELECT * FROM Ingredients`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

app.get("/pancake-batches", (req, res) => {
  db.all(`SELECT * FROM PancakeBatches ORDER BY date DESC`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
