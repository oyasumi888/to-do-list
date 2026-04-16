import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/pool.js', () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { AuthService } from './auth.service.js';

const mockBcryptHash = vi.mocked(bcrypt.hash);
const mockBcryptCompare = vi.mocked(bcrypt.compare);
const mockJwtSign = vi.mocked(jwt.sign);
const mockJwtVerify = vi.mocked(jwt.verify);
const mockPoolQuery = vi.mocked(pool.query);

describe('AuthService.register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hashes password, inserts user and returns created row', async () => {
    const created = {
      id: 'u1',
      nombre: 'Ricardo',
      email: 'ric@example.com',
      creado_en: '2026-04-16T00:00:00.000Z',
    };
    mockBcryptHash.mockResolvedValueOnce('hashed_pw' as never);
    mockPoolQuery.mockResolvedValueOnce({ rows: [created] } as never);

    const result = await AuthService.register('Ricardo', 'ric@example.com', 'secret123');

    expect(mockBcryptHash).toHaveBeenCalledWith('secret123', 10);
    expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO usuarios'),
      ['Ricardo', 'ric@example.com', 'hashed_pw']
    );
    expect(result).toEqual(created);
  });

  it('propagates hash errors', async () => {
    mockBcryptHash.mockRejectedValueOnce(new Error('hash failed'));

    await expect(AuthService.register('Ricardo', 'ric@example.com', 'secret123')).rejects.toThrow(
      'hash failed'
    );
    expect(mockPoolQuery).not.toHaveBeenCalled();
  });

  it('propagates db insert errors', async () => {
    mockBcryptHash.mockResolvedValueOnce('hashed_pw' as never);
    mockPoolQuery.mockRejectedValueOnce(new Error('duplicate key'));

    await expect(AuthService.register('Ricardo', 'ric@example.com', 'secret123')).rejects.toThrow(
      'duplicate key'
    );
  });
});

describe('AuthService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when user does not exist', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] } as never);

    await expect(AuthService.login('none@example.com', 'secret123')).rejects.toThrow(
      'Credenciales inválidas'
    );
    expect(mockBcryptCompare).not.toHaveBeenCalled();
    expect(mockJwtSign).not.toHaveBeenCalled();
  });

  it('throws when password is incorrect', async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ id: 'u1', email: 'ric@example.com', nombre: 'Ricardo', password_hash: 'hashed' }],
    } as never);
    mockBcryptCompare.mockResolvedValueOnce(false as never);

    await expect(AuthService.login('ric@example.com', 'wrong')).rejects.toThrow(
      'Credenciales inválidas'
    );
    expect(mockJwtSign).not.toHaveBeenCalled();
  });

  it('returns token and public user fields on success', async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ id: 'u1', email: 'ric@example.com', nombre: 'Ricardo', password_hash: 'hashed' }],
    } as never);
    mockBcryptCompare.mockResolvedValueOnce(true as never);
    mockJwtSign.mockReturnValueOnce('token123' as never);

    const result = await AuthService.login('ric@example.com', 'secret123');

    expect(mockJwtSign).toHaveBeenCalledWith(
      { id: 'u1', email: 'ric@example.com' },
      expect.any(String),
      { expiresIn: '24h' }
    );
    expect(result).toEqual({
      token: 'token123',
      usuario: { id: 'u1', nombre: 'Ricardo', email: 'ric@example.com' },
    });
  });

  it('propagates query errors', async () => {
    mockPoolQuery.mockRejectedValueOnce(new Error('db down'));
    await expect(AuthService.login('ric@example.com', 'secret123')).rejects.toThrow('db down');
  });

  it('propagates compare errors', async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ id: 'u1', email: 'ric@example.com', nombre: 'Ricardo', password_hash: 'hashed' }],
    } as never);
    mockBcryptCompare.mockRejectedValueOnce(new Error('compare failed'));

    await expect(AuthService.login('ric@example.com', 'secret123')).rejects.toThrow('compare failed');
  });
});

describe('AuthService.validateToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns payload when token is valid', () => {
    mockJwtVerify.mockReturnValueOnce({ id: 'u1', email: 'ric@example.com' } as never);

    const payload = AuthService.validateToken('valid-token');

    expect(mockJwtVerify).toHaveBeenCalledWith('valid-token', expect.any(String));
    expect(payload).toEqual({ id: 'u1', email: 'ric@example.com' });
  });

  it('maps verify errors to invalid/expired token message', () => {
    mockJwtVerify.mockImplementationOnce(() => {
      throw new Error('jwt malformed');
    });

    expect(() => AuthService.validateToken('bad-token')).toThrow('Token inválido o expirado');
  });
});
