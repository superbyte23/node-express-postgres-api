const mockTokens = new Map();
const TokenModel = {
  _store: mockTokens,
  _reset() { mockTokens.clear(); },
  async save(token, userId, expiresAt) { mockTokens.set(token, { token, user_id: userId, expires_at: expiresAt }); },
  async find(token) {
    const row = mockTokens.get(token);
    if (!row) return null;
    if (new Date(row.expires_at) <= new Date()) { mockTokens.delete(token); return null; }
    return row;
  },
  async delete(token) { mockTokens.delete(token); },
  async deleteAllForUser(userId) {
    for (const [k, v] of mockTokens.entries()) if (v.user_id === userId) mockTokens.delete(k);
  },
  async purgeExpired() { return 0; },
};
module.exports = TokenModel;
