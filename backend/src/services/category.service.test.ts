import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/pool.js', () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from '../db/pool.js';
import { CategoryManager, isValidColorHex } from './category.service.js';

const mockPoolQuery = vi.mocked(pool.query);

describe('CategoryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isValidColorHex', () => {
    it('accepts valid #RRGGBB values', () => {
      expect(isValidColorHex('#ffffff')).toBe(true);
      expect(isValidColorHex('#1A2b3C')).toBe(true);
    });

    it('rejects invalid values', () => {
      expect(isValidColorHex('#fff')).toBe(false);
      expect(isValidColorHex('ffffff')).toBe(false);
      expect(isValidColorHex('#12ZZ34')).toBe(false);
    });
  });

  describe('createCategory', () => {
    it('uses provided color when present', async () => {
      const created = { id: 'c1', nombre: 'Work', color_hex: '#e85d00' };
      mockPoolQuery.mockResolvedValueOnce({ rows: [created] } as never);

      const result = await CategoryManager.createCategory('u1', 'Work', '#e85d00');

      expect(mockPoolQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO categorias'), [
        'u1',
        'Work',
        '#e85d00',
      ]);
      expect(result).toEqual(created);
    });

    it('uses default color when no color is passed', async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ id: 'c1', nombre: 'Personal', color_hex: '#6366f1' }],
      } as never);

      await CategoryManager.createCategory('u1', 'Personal');

      expect(mockPoolQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO categorias'), [
        'u1',
        'Personal',
        '#6366f1',
      ]);
    });
  });

  describe('getCategoriesByUser', () => {
    it('returns rows ordered by name from query', async () => {
      const rows = [{ id: 'c1', nombre: 'A' }, { id: 'c2', nombre: 'B' }];
      mockPoolQuery.mockResolvedValueOnce({ rows } as never);

      const result = await CategoryManager.getCategoriesByUser('u1');

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY nombre ASC'),
        ['u1']
      );
      expect(result).toEqual(rows);
    });
  });

  describe('deleteCategory', () => {
    it('returns true when rowCount > 0', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 } as never);
      await expect(CategoryManager.deleteCategory('c1', 'u1')).resolves.toBe(true);
    });

    it('returns false when nothing is deleted', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 0 } as never);
      await expect(CategoryManager.deleteCategory('c1', 'u1')).resolves.toBe(false);
    });
  });
});
