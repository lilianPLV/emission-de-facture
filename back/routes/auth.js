import express from "express";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
const router = express.Router();
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
 
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  try {
    const [rows] = await pool.query(`SELECT MDP FROM identification WHERE identifiant = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Utilisateur introuvable." });
    }

    const result = await bcrypt.compare(password, rows[0].MDP);

    if (!result) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }

    return res.json({
      messagemail: "ok",
      messageMDP: "ok",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});
export default router;