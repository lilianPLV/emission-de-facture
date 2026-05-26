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
    const hashBDD = '$2a$12$fyZb707d.oVYf0OgqaRmvuBGas.adrrh0nOGxqCeKLacb0whEEU0W'
    const result = await bcrypt.compare(password, hashBDD);

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