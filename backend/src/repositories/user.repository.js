import { pool } from '../config/db.js';
export const users = {
  async create({ username, email, passwordHash, address }) {
    const [result] = await pool.execute('INSERT INTO users (username,email,password_hash,address) VALUES (?,?,?,?)', [username,email,passwordHash,address]);
    return this.byId(result.insertId);
  },
  async byEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },
  async byId(id) {
    const [rows] = await pool.execute('SELECT id,username,email,address,created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  },
};
