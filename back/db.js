import "dotenv/config";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

try {
  const connection = await pool.getConnection();
  console.log("Connexion à la base de données avec succès!");
  connection.release();
} catch (err) {
  console.error(`Échec de la connexion : ${err.message}`);
  process.exit(1);
}

export default pool;
