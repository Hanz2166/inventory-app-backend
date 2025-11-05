require('dotenv').config();

console.log('=== LOADING DATABASE CONFIG ===');

// Helper function to parse DATABASE_URL
const parseDatabaseUrl = (url) => {
  if (!url) return null;
  
  try {
    // Regex pattern untuk parse URL database
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
      console.log(`   Dialect: ${dialect}, Host: ${host}, Database: ${database}`);
      
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
    console.error('❌ Error parsing DATABASE_URL:', error.message);
  }
  
  return null;
};

// Create configuration for each environment
const createConfig = (env) => {
  // Try DATABASE_URL first
  const urlConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  if (urlConfig) {
    console.log(`✅ Using DATABASE_URL for ${env} environment`);
    
    return {
      username: urlConfig.username,
      password: urlConfig.password,
      database: urlConfig.database,
      host: urlConfig.host,
      port: urlConfig.port,
      dialect: urlConfig.dialect,
      timezone: '+07:00',
      logging: env === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: urlConfig.dialect === 'postgres' ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : urlConfig.dialect === 'mysql' ? {
        ssl: {
          rejectUnauthorized: false
        }
      } : {},
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: false,
      }
    };
  }
  
  // Try individual environment variables
  const username = process.env.MYSQLUSER || process.env.DB_USER;
  const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD;
  const database = process.env.MYSQLDATABASE || process.env.DB_NAME;
  const host = process.env.MYSQLHOST || process.env.DB_HOST;
  const port = parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10);
  const dialect = process.env.DB_DIALECT || 'mysql';
  
  // Check if we have minimal config
  if (username && database && host) {
    console.log(`✅ Using individual DB_* variables for ${env} environment`);
    console.log(`   Host: ${host}, Database: ${database}, User: ${username}`);
    
    return {
      username,
      password,
      database,
      host,
      port,
      dialect,
      timezone: '+07:00',
      logging: env === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: dialect === 'mysql' ? {
        ssl: env === 'production' ? {
          rejectUnauthorized: false
        } : undefined
      } : {},
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: false,
      }
    };
  }
  
  // NO FALLBACK in production
  if (env === 'production') {
    console.error('❌ CRITICAL: No database configuration found in production!');
    console.error('Available environment variables:');
    console.error('  MYSQLHOST:', process.env.MYSQLHOST ? 'SET' : 'NOT SET');
    console.error('  MYSQLDATABASE:', process.env.MYSQLDATABASE ? 'SET' : 'NOT SET');
    console.error('  MYSQLUSER:', process.env.MYSQLUSER ? 'SET' : 'NOT SET');
    console.error('  MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? 'SET' : 'NOT SET');
    console.error('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    
    throw new Error('Database configuration is required in production. Please set environment variables in Railway.');
  }
  
  // Fallback to SQLite for development only
  console.warn(`⚠️  WARNING: No database configuration found for ${env}!`);
  console.warn('⚠️  Falling back to SQLite (development/test only)');
  
  return {
    dialect: 'sqlite',
    storage: env === 'test' ? ':memory:' : './dev.sqlite',
    timezone: '+07:00',
    logging: env === 'development' ? console.log : false,
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

// Export configurations
const config = {
  development: createConfig('development'),
  test: createConfig('test'),
  production: createConfig('production'),
};

// Log final config
const env = process.env.NODE_ENV || 'development';
console.log(`Final config for ${env}:`, {
  host: config[env].host || 'N/A',
  port: config[env].port || 'N/A',
  database: config[env].database || 'N/A',
  dialect: config[env].dialect,
  username: config[env].username ? '***' : 'NOT SET',
  storage: config[env].storage || 'N/A'
});

module.exports = config;
```

## Perhatikan juga:

Log menunjukkan `MYSQLDATABASE: 'NOT SET'` - ini berarti **environment variable MySQL belum ter-set dengan benar di Railway!**

### Cek Railway Variables:

1. Buka Railway Dashboard
2. Pilih Backend Service
3. Tab "Variables"
4. **Pastikan ada MySQL service di project yang sama**
5. Tambahkan reference variables:
```
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQLPORT=${{MySQL.MYSQLPORT}}
