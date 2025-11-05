require('dotenv').config();

console.log('=== LOADING DATABASE CONFIG ===');

// Railway provides these variables automatically
const host = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306');
const database = process.env.MYSQLDATABASE || process.env.DB_NAME || 'database';
const username = process.env.MYSQLUSER || process.env.DB_USER || 'root';
const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '';
const dialect = process.env.DB_DIALECT || 'mysql';

console.log('Database credentials check:', {
  host: host ? 'SET' : 'NOT SET',
  port: port,
  database: database ? 'SET' : 'NOT SET',
  username: username ? 'SET' : 'NOT SET',
  password: password ? 'SET' : 'NOT SET',
  dialect: dialect
});

// Jika tidak ada konfigurasi database, gunakan SQLite fallback
if (!host || !database || !username) {
  console.warn('⚠️  WARNING: No database configuration found!');
  console.warn('⚠️  Falling back to SQLite in-memory (data will NOT persist)');
  console.warn('⚠️  Please set DATABASE_URL or DB_* environment variables in Railway');
}

// Common configuration for all environments
const commonConfig = {
  dialect: (!host || !database || !username) ? 'sqlite' : dialect,
  timezone: process.env.DB_TIMEZONE || '+07:00',
  logging: process.env.ENABLE_SQL_LOGGING === 'true' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '5'),
    min: parseInt(process.env.DB_POOL_MIN || '0'),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
  },
};

// Production configuration
const productionConfig = {
  ...commonConfig,
  host,
  port,
  database,
  username,
  password,
  dialectOptions: {
    connectTimeout: 60000,
  },
};

// Development configuration (sama dengan production untuk konsistensi)
const developmentConfig = {
  ...productionConfig,
  logging: process.env.ENABLE_SQL_LOGGING === 'true' ? console.log : false,
};

// Test configuration (gunakan SQLite)
const testConfig = {
  ...commonConfig,
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
};

console.log('Final config for', process.env.NODE_ENV || 'development', ':', {
  host: productionConfig.host,
  port: productionConfig.port,
  database: productionConfig.database,
  dialect: productionConfig.dialect,
  username: productionConfig.username ? '***' : 'NOT SET'
});

module.exports = {
  development: developmentConfig,
  production: productionConfig,
  test: testConfig,
};
