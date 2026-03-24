import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev';
const JWT_EXPIRES_IN = '24h';

export interface JwtPayload {
  id: string;
  email: string;
}

export const AuthService = {

  async register(nombre: string, email: string, password: string) {
    const password_hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, email, creado_en`,
      [nombre, email, password_hash]
    );

    return rows[0];
  },

  async login(email: string, password: string) {
    // Buscar usuario por email
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    const usuario = rows[0];
    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      throw new Error('Credenciales inválidas');
    }

    // Generar JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email } satisfies JwtPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      },
    };
  },

  validateToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return payload;
    } catch {
      throw new Error('Token inválido o expirado');
    }
  },
};
