const { query } = require('../config/database');

const T = 'users';

/**
 * Strips password_hash before returning to callers.
 */
const sanitize = (row) => {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return safe;
};

const UserModel = {
  async create({ name, email, passwordHash, role = 'user' }) {
    const { rows } = await query(
      `INSERT INTO ${T} (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email.toLowerCase(), passwordHash, role]
    );
    return sanitize(rows[0]);
  },

  async findByEmail(email, includePwHash = false) {
    const { rows } = await query(
      `SELECT * FROM ${T} WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()]
    );
    return includePwHash ? rows[0] : sanitize(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT * FROM ${T} WHERE id = $1 LIMIT 1`,
      [id]
    );
    return sanitize(rows[0]);
  },

  async findAll() {
    const { rows } = await query(
      `SELECT * FROM ${T} ORDER BY created_at DESC`,
      []
    );
    return rows.map(sanitize);
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (!keys.length) return this.findById(id);

    // Map camelCase → snake_case for known fields
    const colMap = {
      name: 'name',
      role: 'role',
      isActive: 'is_active',
      passwordHash: 'password_hash',
    };

    const setClauses = keys.map((k, i) => `${colMap[k] || k} = $${i + 1}`);
    const values = keys.map((k) => fields[k]);

    const { rows } = await query(
      `UPDATE ${T}
       SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${keys.length + 1}
       RETURNING *`,
      [...values, id]
    );
    return sanitize(rows[0]);
  },

  async emailExists(email) {
    const { rows } = await query(
      `SELECT 1 FROM ${T} WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()]
    );
    return rows.length > 0;
  },

  async deactivate(id) {
    return this.update(id, { isActive: false });
  },
};

module.exports = UserModel;
