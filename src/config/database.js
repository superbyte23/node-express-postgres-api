const { Pool } = require('pg');
const config = require('./index');

/**
 * Single PostgreSQL database, single schema (public).
 *
 *   public.users
 *   public.refresh_tokens
 */

let pool = null;

const connect = async () => {
  pool = new Pool({
    connectionString: config.database.url,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        name          VARCHAR(50)  NOT NULL,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT         NOT NULL,
        role          VARCHAR(20)  NOT NULL DEFAULT 'user'
                        CHECK (role IN ('user', 'admin')),
        is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        token       TEXT        NOT NULL UNIQUE,
        user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token
        ON refresh_tokens (token);

      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
        ON refresh_tokens (user_id);
    `);

    console.log('[DB] Connected → auth_db (public schema)');
  } finally {
    client.release();
  }

  pool.on('error', (err) => console.error('[DB] Pool error:', err));

  return pool;
};

const disconnect = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Connection pool closed.');
  }
};

const getPool = () => {
  if (!pool) throw new Error('DB pool not initialized. Call connect() first.');
  return pool;
};

const query = (text, params) => getPool().query(text, params);

module.exports = { connect, disconnect, getPool, query };