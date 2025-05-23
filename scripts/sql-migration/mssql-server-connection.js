/**
 * MS SQL Server Connection Module for ComplyArk
 * This module provides database connectivity to SQL Server using the 'mssql' package.
 */

const sql = require('mssql');
const config = require('../config');

/**
 * SQL Server connection configuration
 */
const sqlConfig = {
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  server: config.database.server,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // For Azure SQL
    trustServerCertificate: false, // Change to true for local dev / self-signed certs
    enableArithAbort: true
  }
};

/**
 * Creates a connection pool to SQL Server
 * @returns {Promise<sql.ConnectionPool>} A promise that resolves to the connection pool
 */
async function getConnection() {
  try {
    const pool = await sql.connect(sqlConfig);
    console.log('Connected to SQL Server');
    return pool;
  } catch (err) {
    console.error('SQL Server connection error:', err);
    throw err;
  }
}

/**
 * Executes a SQL query
 * @param {string} query - SQL query to execute
 * @param {Object} params - Parameters for the query (optional)
 * @returns {Promise<any>} A promise that resolves to the query result
 */
async function executeQuery(query, params = {}) {
  try {
    const pool = await getConnection();
    const request = pool.request();

    // Add parameters to the request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error('SQL query execution error:', err);
    throw err;
  }
}

/**
 * Executes a stored procedure
 * @param {string} procedureName - Name of the stored procedure
 * @param {Object} params - Parameters for the stored procedure (optional)
 * @returns {Promise<any>} A promise that resolves to the procedure result
 */
async function executeProcedure(procedureName, params = {}) {
  try {
    const pool = await getConnection();
    const request = pool.request();

    // Add parameters to the request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.execute(procedureName);
    return result.recordset;
  } catch (err) {
    console.error(`Error executing procedure ${procedureName}:`, err);
    throw err;
  }
}

/**
 * Closes all active connections
 * @returns {Promise<void>} A promise that resolves when connections are closed
 */
async function closeConnection() {
  try {
    await sql.close();
    console.log('SQL Server connections closed');
  } catch (err) {
    console.error('Error closing SQL Server connections:', err);
    throw err;
  }
}

/**
 * Begins a transaction
 * @returns {Promise<sql.Transaction>} A promise that resolves to the transaction
 */
async function beginTransaction() {
  try {
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    return transaction;
  } catch (err) {
    console.error('Error beginning transaction:', err);
    throw err;
  }
}

/**
 * Commits a transaction
 * @param {sql.Transaction} transaction - The transaction to commit
 * @returns {Promise<void>} A promise that resolves when the transaction is committed
 */
async function commitTransaction(transaction) {
  try {
    await transaction.commit();
  } catch (err) {
    console.error('Error committing transaction:', err);
    throw err;
  }
}

/**
 * Rolls back a transaction
 * @param {sql.Transaction} transaction - The transaction to roll back
 * @returns {Promise<void>} A promise that resolves when the transaction is rolled back
 */
async function rollbackTransaction(transaction) {
  try {
    await transaction.rollback();
  } catch (err) {
    console.error('Error rolling back transaction:', err);
    throw err;
  }
}

/**
 * Executes a query within a transaction
 * @param {sql.Transaction} transaction - The transaction to use
 * @param {string} query - SQL query to execute
 * @param {Object} params - Parameters for the query (optional)
 * @returns {Promise<any>} A promise that resolves to the query result
 */
async function executeTransactionQuery(transaction, query, params = {}) {
  try {
    const request = new sql.Request(transaction);

    // Add parameters to the request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error('Error executing query in transaction:', err);
    throw err;
  }
}

module.exports = {
  getConnection,
  executeQuery,
  executeProcedure,
  closeConnection,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  executeTransactionQuery
};