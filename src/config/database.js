require('dotenv').config();

console.log('=== LOADING DATABASE CONFIG ===');

const parseDatabaseUrl = (url) => {
  if (!url) return null;
  
  try {
    const pattern = /^(\w+):\/\/([^:]+):([^@]+)@([^:/]+):?(\d+)?\/(.+?)(\?.*)?$/;
    const match = url.match(pattern);
    
    if (match) {
      const protocol = match[1];
      const username = match[2];
      const password = match[3];
      const host = match[4];
      const port = match[5];
      const database = match[6];
      
      let dialect = protocol;
      if (protocol === 'postgresql' || protocol === 'postgres') {
        dialect = 'postgres';
      } else if (protocol === 'mysql') {
        dialect = 'mysql';
      }
      
      console.log('✅ DATABASE_URL parsed successfully');
      
      return {
        dialect,
        username,
        password,
        database,
        host,
        port: parseInt(port || (dialect === 'mysql' ? '3306' : '5432'), 10)
      };
    }
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error.message);
  }
  
  return null;
};

const createConfig = (env) => {
  const urlConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  if (urlConfig) {
    console.log(`Using DATABASE_URL for ${env}`);
    
    return {
      username: urlConfig.username,
      password: urlConfig.password,
      database: urlConfig.database,
      host: urlConfig.host,
      port: urlConfig.port,
      dialect: urlConfig.dialect,
      timezone: '+07:00',
      logging: env === 'development',
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: urlConfig.dialect === 'postgres' ? {
        ssl: { require: true, rejectUnauthorized: false }
      } : urlConfig.dialect === 'mysql' ? {
        ssl: { rejectUnauthorized: false }
      } : {},
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: false,
      }
    };
  }
  
  const username = process.env.MYSQLUSER || process.env.DB_USER;
  const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD;
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME;
  const host = process.env.MYSQLHOST || process.env.DB_HOST;
  const port = parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10);
  const dialect = process.env.DB_DIALECT || 'mysql';
  
  if (username && database && host) {
    console.log(`Using individual variables for ${env}`);
    
    return {
      username,
      password,
      database,
      host,
      port,
      dialect,
      timezone: '+07:00',
      logging: env === 'development',
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: dialect === 'mysql' ? {
        ssl: env === 'production' ? { rejectUnauthorized: false } : undefined
      } : {},
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: false,
      }
    };
  }
  
  if (env === 'production') {
    console.error('No database configuration found in production!');
    console.error('MYSQLHOST:', process.env.MYSQLHOST ? 'SET' : 'NOT SET');
    console.error('MYSQLDATABASE:', process.env.MYSQLDATABASE ? 'SET' : 'NOT SET');
    console.error('MYSQLUSER:', process.env.MYSQLUSER ? 'SET' : 'NOT SET');
    
    throw new Error('Database configuration required in production');
  }
  
  console.warn('No database config found, using SQLite fallback');
  
  return {
    dialect: 'sqlite',
    storage: env === 'test' ? ':memory:' : './dev.sqlite',
    timezone: '+07:00',
    logging: env === 'development',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: false,
    }
  };
};

const config = {
  development: createConfig('development'),
  test: createConfig('test'),
  production: createConfig('production'),
};

const env = process.env.NODE_ENV || 'development';
console.log(`Config for ${env}:`, {
  host: config[env].host || 'N/A',
  port: config[env].port || 'N/A',
  database: config[env].database || 'N/A',
  dialect: config[env].dialect,
  username: config[env].username ? '***' : 'NOT SET'
});

module.exports = config;
