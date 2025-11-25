import pgPromise from "pg-promise";
const pgp = pgPromise();
//To reload .env file
// set -a
// source .env
// set +a
// npm start

//Burstsble server uses just the admin name
export const db = pgp({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_DATABASE || "postgres",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});
