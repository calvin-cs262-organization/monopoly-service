import pgPromise from "pg-promise";
const pgp = pgPromise();

export const db = pgp({
  host: process.env.DB_HOST, // sv-idayatu.postgres.database.azure.com
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_DATABASE || "postgres",
  user: process.env.DB_USER, // MUST be idayatu@sv-idayatu
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, // Required by Azure
});
