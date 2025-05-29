// MSSQL Database Connection Configuration for Windows
import sql from 'mssql';
import * as dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  server: process.env.MSSQL_SERVER || 'localhost',
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  database: process.env.MSSQL_DATABASE || 'ComplyArkDB',
  user: process.env.MSSQL_USERNAME || 'complyark_user',
  password: process.env.MSSQL_PASSWORD || 'ComplyArk@2024',
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    instanceName: process.env.MSSQL_INSTANCE_NAME,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Connected to MSSQL database');
  }
  return pool;
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('MSSQL connection closed');
  }
}

export { sql };