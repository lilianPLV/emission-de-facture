import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import facturesRoutes from "./routes/facture.js";
import creationFactureRoutes from "./routes/creationFacture.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '10mb' }))

app.use(express.static(path.join(__dirname, "../front")));

app.use("/api/auth", authRoutes);
app.use("/api/facture", facturesRoutes);
app.use("/api/creation-facture", creationFactureRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Serveur sur http://localhost:${PORT}`));