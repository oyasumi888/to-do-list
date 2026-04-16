import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/pool.js', () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from '../db/pool.js';
import { TaskService, isValidEstado } from './task.service.js';

const mockPoolQuery = vi.mocked(pool.query);

describe('TaskService helpers', () => {
  it('validates allowed estados', () => {
    expect(isValidEstado('pendiente')).toBe(true);
    expect(isValidEstado('en_progreso')).toBe(true);
    expect(isValidEstado('completada')).toBe(true);
    expect(isValidEstado('expirada')).toBe(false);
    expect(isValidEstado('otro')).toBe(false);
  });

  it('extracts basename from public uploads URL', () => {
    expect(TaskService.storageBasenameFromPublicUrl('http://localhost:3000/uploads/a-b-c.pdf')).toBe(
      'a-b-c.pdf'
    );
    expect(TaskService.storageBasenameFromPublicUrl('http://localhost:3000/nope/a-b-c.pdf')).toBeNull();
  });
});

describe('TaskService core flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createTask inserts task and category links (multi-category)', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ id: 'c1' }, { id: 'c2' }] } as never) // category ownership check
      .mockResolvedValueOnce({ rows: [{ id: 't1' }] } as never) // task insert
      .mockResolvedValueOnce({ rows: [] } as never) // insert links
      .mockResolvedValueOnce({
        rows: [
          {
            id: 't1',
            usuario_id: 'u1',
            titulo: 'Task',
            descripcion: null,
            fecha_limite: null,
            estado: 'pendiente',
            creado_en: '2026-04-16T00:00:00.000Z',
            archivos: [],
            categorias: [{ id: 'c1', nombre: 'A', color_hex: '#111111' }],
          },
        ],
      } as never); // getTaskWithArchivos

    const result = await TaskService.createTask('u1', 'Task', undefined, undefined, undefined, [
      'c1',
      'c2',
      'c1',
    ]);

    expect(mockPoolQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT id FROM categorias'),
      ['u1', ['c1', 'c2']]
    );
    expect(mockPoolQuery).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO tarea_categoria'),
      ['t1', ['c1', 'c2']]
    );
    expect(result).toMatchObject({ id: 't1', titulo: 'Task' });
  });

  it('createTask throws when category does not belong to user', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: 'c1' }] } as never);

    await expect(TaskService.createTask('u1', 'Task', undefined, undefined, undefined, ['c1', 'c2']))
      .rejects.toThrow('Categoría no válida');
  });

  it('getTasksByUser maps null relation arrays to []', async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 't1',
          usuario_id: 'u1',
          titulo: 'Task',
          descripcion: null,
          fecha_limite: null,
          estado: 'pendiente',
          creado_en: '2026-04-16T00:00:00.000Z',
          archivos: null,
          categorias: null,
        },
      ],
    } as never);

    const rows = await TaskService.getTasksByUser('u1');

    expect(rows[0]).toMatchObject({ archivos: [], categorias: [] });
  });

  it('updateTaskStatus rejects invalid estado', async () => {
    await expect(TaskService.updateTaskStatus('t1', 'u1', 'expirada')).rejects.toThrow('Estado inválido');
    expect(mockPoolQuery).not.toHaveBeenCalled();
  });

  it('assignCategory returns not_found when task is missing', async () => {
    const belongsSpy = vi.spyOn(TaskService, 'taskBelongsToUser').mockResolvedValueOnce(false);

    const result = await TaskService.assignCategory('t1', 'c1', 'u1');

    expect(result).toEqual({ ok: false, status: 'not_found' });
    belongsSpy.mockRestore();
  });

  it('assignCategory returns created when link inserted', async () => {
    const belongsSpy = vi.spyOn(TaskService, 'taskBelongsToUser').mockResolvedValueOnce(true);
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ 1: 1 }] } as never) // category ownership exists
      .mockResolvedValueOnce({ rows: [{ tarea_id: 't1', categoria_id: 'c1' }] } as never); // insert link

    const result = await TaskService.assignCategory('t1', 'c1', 'u1');

    expect(result).toEqual({ ok: true, status: 'created', tarea_id: 't1', categoria_id: 'c1' });
    belongsSpy.mockRestore();
  });

  it('setCategories returns undefined when task does not belong to user', async () => {
    const belongsSpy = vi.spyOn(TaskService, 'taskBelongsToUser').mockResolvedValueOnce(false);

    const result = await TaskService.setCategories('t1', ['c1'], 'u1');

    expect(result).toBeUndefined();
    expect(mockPoolQuery).not.toHaveBeenCalled();
    belongsSpy.mockRestore();
  });

  it('setCategories runs transaction and returns refreshed task', async () => {
    const belongsSpy = vi.spyOn(TaskService, 'taskBelongsToUser').mockResolvedValueOnce(true);
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ id: 'c1' }] } as never) // category ownership check
      .mockResolvedValueOnce({} as never) // BEGIN
      .mockResolvedValueOnce({} as never) // DELETE old links
      .mockResolvedValueOnce({} as never) // INSERT new links
      .mockResolvedValueOnce({} as never) // COMMIT
      .mockResolvedValueOnce({
        rows: [
          {
            id: 't1',
            usuario_id: 'u1',
            titulo: 'Task',
            descripcion: null,
            fecha_limite: null,
            estado: 'pendiente',
            creado_en: '2026-04-16T00:00:00.000Z',
            archivos: [],
            categorias: [{ id: 'c1', nombre: 'A', color_hex: '#111111' }],
          },
        ],
      } as never); // getTaskWithArchivos

    const result = await TaskService.setCategories('t1', ['c1', 'c1'], 'u1');

    expect(mockPoolQuery).toHaveBeenNthCalledWith(2, 'BEGIN');
    expect(mockPoolQuery).toHaveBeenNthCalledWith(5, 'COMMIT');
    expect(result).toMatchObject({ id: 't1' });
    belongsSpy.mockRestore();
  });

  it('setCategories rolls back transaction on failure', async () => {
    const belongsSpy = vi.spyOn(TaskService, 'taskBelongsToUser').mockResolvedValueOnce(true);
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ id: 'c1' }] } as never) // category ownership check
      .mockResolvedValueOnce({} as never) // BEGIN
      .mockResolvedValueOnce({} as never) // DELETE old links
      .mockRejectedValueOnce(new Error('insert links failed')) // INSERT new links fails
      .mockResolvedValueOnce({} as never); // ROLLBACK

    await expect(TaskService.setCategories('t1', ['c1'], 'u1')).rejects.toThrow('insert links failed');
    expect(mockPoolQuery).toHaveBeenLastCalledWith('ROLLBACK');
    belongsSpy.mockRestore();
  });
});
