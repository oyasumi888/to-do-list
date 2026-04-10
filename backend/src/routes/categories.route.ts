import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { CategoryManager, isValidColorHex } from '../services/category.service.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const usuario_id = req.user!.id;
    const categories = await CategoryManager.getCategoriesByUser(usuario_id);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, color_hex } = req.body as Record<string, string | undefined>;
    if (typeof nombre !== 'string' || nombre.trim() === '') {
      res.status(400).json({ error: 'nombre es requerido' });
      return;
    }
    const nombreTrim = nombre.trim();
    if (nombreTrim.length > 50) {
      res.status(400).json({ error: 'nombre no puede superar 50 caracteres' });
      return;
    }
    if (color_hex !== undefined && color_hex !== null && color_hex !== '') {
      if (typeof color_hex !== 'string' || !isValidColorHex(color_hex)) {
        res.status(400).json({ error: 'color_hex debe ser formato #RRGGBB' });
        return;
      }
    }

    const usuario_id = req.user!.id;
    const category = await CategoryManager.createCategory(
      usuario_id,
      nombreTrim,
      typeof color_hex === 'string' && color_hex !== '' ? color_hex : undefined
    );
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
