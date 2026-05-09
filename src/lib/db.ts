import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host:             process.env.DB_HOST     || "localhost",
  port:             Number(process.env.DB_PORT) || 3306,
  user:             process.env.DB_USER     || "root",
  password:         process.env.DB_PASSWORD || "",
  database:         process.env.DB_NAME     || "jualan",
  waitForConnections: true,
  connectionLimit:  10,
  charset:          "utf8mb4",
});

/** Ambil banyak baris */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/** Ambil satu baris (undefined jika tidak ada) */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | undefined> {
  const rows = await query<T>(sql, params);
  return rows[0];
}

/** INSERT / UPDATE / DELETE — kembalikan ResultSetHeader */
export async function execute(
  sql: string,
  params?: unknown[]
): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

export default pool;
