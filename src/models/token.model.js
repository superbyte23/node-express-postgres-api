const { query } = require('../config/database');

const T = 'refresh_tokens';

const TokenModel = {
  async save(token, userId, expiresAt) {
    await query(
      `INSERT INTO ${T} (token, user_id, expires_at) VALUES ($1, $2, $3)`,
      [token, userId, expiresAt]
    );
  },

  async find(token) {
    const { rows } = await query(
      `SELECT * FROM ${T} WHERE token = $1 AND expires_at > NOW() LIMIT 1`,
      [token]
    );
    return rows[0] || null;
  },

  async delete(token) {
    await query(`DELETE FROM ${T} WHERE token = $1`, [token]);
  },

  async deleteAllForUser(userId) {
    await query(`DELETE FROM ${T} WHERE user_id = $1`, [userId]);
  },

  /**
   * Purge expired tokens (run periodically or on startup).
   * PostgreSQL doesn't auto-delete like MongoDB TTL indexes,
   * so this keeps the table clean.
   */
  async purgeExpired() {
    const { rowCount } = await query(
      `DELETE FROM ${T} WHERE expires_at <= NOW()`,
      []
    );
    return rowCount;
  },
};

module.exports = TokenModel;
