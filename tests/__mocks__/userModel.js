const { v4: uuidv4 } = require('uuid');
const mockUsers = new Map();
const UserModel = {
  _store: mockUsers,
  _reset() { mockUsers.clear(); },
  async create({ name, email, passwordHash, role }) {
    const exists = [...mockUsers.values()].find(u => u.email === email.toLowerCase());
    if (exists) throw Object.assign(new Error('duplicate'), { code: '23505' });
    const id = uuidv4();
    const row = { id, name, email: email.toLowerCase(), password_hash: passwordHash, role: role || 'user', is_active: true, created_at: new Date(), updated_at: new Date() };
    mockUsers.set(id, row);
    const { password_hash, ...safe } = row;
    return safe;
  },
  async findByEmail(email, includePwHash = false) {
    const row = [...mockUsers.values()].find(u => u.email === email.toLowerCase());
    if (!row) return null;
    if (includePwHash) return row;
    const { password_hash, ...safe } = row;
    return safe;
  },
  async findById(id) {
    const row = mockUsers.get(id);
    if (!row) return null;
    const { password_hash, ...safe } = row;
    return safe;
  },
  async findAll() {
    return [...mockUsers.values()].map(({ password_hash, ...safe }) => safe);
  },
  async update(id, fields) {
    const row = mockUsers.get(id);
    if (!row) return null;
    const fieldMap = { name: 'name', isActive: 'is_active', passwordHash: 'password_hash' };
    const updated = { ...row };
    for (const [k, v] of Object.entries(fields)) updated[fieldMap[k] || k] = v;
    updated.updated_at = new Date();
    mockUsers.set(id, updated);
    const { password_hash, ...safe } = updated;
    return safe;
  },
  async emailExists(email) {
    return [...mockUsers.values()].some(u => u.email === email.toLowerCase());
  },
  async deactivate(id) { return UserModel.update(id, { isActive: false }); },
};
module.exports = UserModel;
