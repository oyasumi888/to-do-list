import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { unlink } from 'fs/promises';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { TaskService, isValidEstado } from '../services/task.service.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({ storage });

function routeParamId(req: { params: Record<string, string | string[] | undefined> }): string | undefined {
  const v = req.params['id'];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function routeParamArchivoId(req: { params: Record<string, string | string[] | undefined> }): string | undefined {
  const v = req.params['archivoId'];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

const router = Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const usuario_id = req.user!.id;
    const raw = req.query['fecha_limite'];
    const q = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;
    const fecha =
      typeof q === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : undefined;
    const tasks = await TaskService.getTasksByUser(usuario_id, fecha);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/by-date', async (req, res) => {
  try {
    const usuario_id = req.user!.id;
    const tasks = await TaskService.filterByDate(usuario_id);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const { titulo, descripcion, fecha_limite, estado, categoria_id } = req.body as Record<
      string,
      string | undefined
    >;
    if (typeof titulo !== 'string' || titulo.trim() === '') {
      res.status(400).json({ error: 'titulo es requerido' });
      return;
    }
    if (titulo.trim().length > 200) {
      res.status(400).json({ error: 'titulo no puede superar 200 caracteres' });
      return;
    }
    if (typeof descripcion === 'string' && descripcion.length > 300) {
      res.status(400).json({ error: 'descripcion no puede superar 300 caracteres' });
      return;
    }
    if (estado !== undefined && estado !== null && !isValidEstado(estado)) {
      res.status(400).json({ error: 'estado inválido' });
      return;
    }
    if (
      categoria_id !== undefined &&
      categoria_id !== null &&
      categoria_id !== '' &&
      !UUID_REGEX.test(categoria_id)
    ) {
      res.status(400).json({ error: 'categoria_id no es un UUID válido' });
      return;
    }
    const usuario_id = req.user!.id;
    let task;
    try {
      task = await TaskService.createTask(
        usuario_id,
        titulo.trim(),
        typeof descripcion === 'string' ? descripcion : undefined,
        typeof fecha_limite === 'string' && fecha_limite !== '' ? fecha_limite : undefined,
        estado !== undefined && estado !== null && isValidEstado(estado) ? estado : undefined,
        typeof categoria_id === 'string' && categoria_id !== '' ? categoria_id : undefined
      );
    } catch (e) {
      if (e instanceof Error && e.message === 'Categoría no válida') {
        res.status(400).json({ error: e.message });
        return;
      }
      throw e;
    }
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.put('/:id/categories', async (req, res) => {
  try {
    const tareaId = routeParamId(req);
    const { categoria_id } = req.body as { categoria_id?: string };
    if (!tareaId) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }
    if (typeof categoria_id !== 'string' || categoria_id.trim() === '') {
      res.status(400).json({ error: 'categoria_id es requerido' });
      return;
    }
    const cid = categoria_id.trim();
    if (!UUID_REGEX.test(cid)) {
      res.status(400).json({ error: 'categoria_id no es un UUID válido' });
      return;
    }
    const usuario_id = req.user!.id;
    const result = await TaskService.assignCategory(tareaId, cid, usuario_id);
    if (!result.ok) {
      res.status(404).json({ error: 'Tarea o categoría no encontrada' });
      return;
    }
    if (result.status === 'created') {
      res.status(201).json({ tarea_id: result.tarea_id, categoria_id: result.categoria_id });
      return;
    }
    res.status(200).json({ tarea_id: result.tarea_id, categoria_id: result.categoria_id });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { estado } = req.body as { estado?: string };
    if (typeof estado !== 'string' || !isValidEstado(estado)) {
      res.status(400).json({ error: 'estado inválido o faltante' });
      return;
    }
    const id = routeParamId(req);
    if (!id) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }
    const usuario_id = req.user!.id;
    let task;
    try {
      task = await TaskService.updateTaskStatus(id, usuario_id, estado);
    } catch (e) {
      if (e instanceof Error && e.message === 'Estado inválido') {
        res.status(400).json({ error: 'estado inválido' });
        return;
      }
      throw e;
    }
    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.patch('/:id/postpone', async (req, res) => {
  try {
    const id = routeParamId(req);
    if (!id) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const { fecha_limite } = req.body as { fecha_limite?: string | null };
    let fecha: string | null;
    if (fecha_limite === null || fecha_limite === '') {
      fecha = null;
    } else if (typeof fecha_limite === 'string') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_limite)) {
        res.status(400).json({ error: 'fecha_limite debe ser YYYY-MM-DD o null' });
        return;
      }
      fecha = fecha_limite;
    } else {
      res.status(400).json({ error: 'fecha_limite debe ser YYYY-MM-DD o null' });
      return;
    }

    const usuario_id = req.user!.id;
    const task = await TaskService.postpone(id, usuario_id, fecha);
    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.delete('/:id/archivos/:archivoId', async (req, res) => {
  try {
    const tareaId = routeParamId(req);
    const archivoId = routeParamArchivoId(req);
    if (!tareaId || !archivoId) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }
    const usuario_id = req.user!.id;
    const removed = await TaskService.deleteTareaArchivo(archivoId, tareaId, usuario_id);
    if (!removed) {
      res.status(404).json({ error: 'Archivo no encontrado' });
      return;
    }
    const base = TaskService.storageBasenameFromPublicUrl(removed.url);
    if (base) {
      const filePath = path.join(uploadsDir, base);
      await unlink(filePath).catch(() => undefined);
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = routeParamId(req);
    if (!id) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }
    const usuario_id = req.user!.id;
    const deleted = await TaskService.deleteTask(id, usuario_id);
    if (!deleted) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post(
  '/:id/upload',
  async (req, res, next) => {
    try {
      const taskId = routeParamId(req);
      if (!taskId) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      const usuario_id = req.user!.id;
      const belongs = await TaskService.taskBelongsToUser(taskId, usuario_id);
      if (!belongs) {
        res.status(404).json({ error: 'Tarea no encontrada' });
        return;
      }
      next();
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  },
  upload.single('archivo'),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Archivo requerido' });
        return;
      }
      const taskId = routeParamId(req);
      if (!taskId) {
        await unlink(req.file.path);
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      const usuario_id = req.user!.id;

      const base =
        process.env.PUBLIC_API_URL?.replace(/\/$/, '') ||
        `${req.protocol}://${req.get('host')}`;
      const publicUrl = `${base}/uploads/${req.file.filename}`;
      const nombreOriginal = req.file.originalname.slice(0, 255);

      const inserted = await TaskService.insertTareaArchivo(taskId, publicUrl, nombreOriginal);
      if (!inserted) {
        await unlink(req.file.path);
        res.status(500).json({ error: 'No se pudo guardar el archivo' });
        return;
      }
      const task = await TaskService.getTaskWithArchivos(taskId, usuario_id);
      res.status(201).json(task);
    } catch (error) {
      if (req.file?.path) {
        await unlink(req.file.path).catch(() => undefined);
      }
      res.status(500).json({ error: String(error) });
    }
  }
);

export default router;
