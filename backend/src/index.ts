import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db/pool.js';
import { AuthService } from './services/auth.service.js';
import tasksRouter from './routes/tasks.route.js';
import categoriesRouter from './routes/categories.route.js';

dotenv.config();

// #region agent log
fetch('http://127.0.0.1:7615/ingest/a86b710b-9360-41e3-aa3f-55206aec8239',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cd3ac2'},body:JSON.stringify({sessionId:'cd3ac2',location:'src/index.ts:12',message:'Server entry reached',data:{node:process.version,port:process.env.PORT,env:process.env.NODE_ENV},timestamp:Date.now(),hypothesisId:'A-D'})}).catch(()=>{});
// #endregion

const app = express();
const PORT = process.env.PORT || 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, '../uploads');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsRoot));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'conectado' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'sin conexión', error });
  }
});

app.use('/api/tasks', tasksRouter);
app.use('/api/categories', categoriesRouter);

app.post('/auth/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body as {
      nombre?: unknown;
      email?: unknown;
      password?: unknown;
    };
    if (typeof nombre !== 'string' || nombre.trim() === '') {
      res.status(400).json({ error: 'nombre es requerido' });
      return;
    }
    if (nombre.trim().length > 100) {
      res.status(400).json({ error: 'nombre no puede superar 100 caracteres' });
      return;
    }
    if (typeof email !== 'string' || email.trim() === '') {
      res.status(400).json({ error: 'email es requerido' });
      return;
    }
    if (email.trim().length > 150) {
      res.status(400).json({ error: 'email no puede superar 150 caracteres' });
      return;
    }
    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'password debe tener al menos 6 caracteres' });
      return;
    }
    const usuario = await AuthService.register(nombre.trim(), email.trim(), password);
    res.json(usuario);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: unknown; password?: unknown };
    if (typeof email !== 'string' || email.trim() === '' || email.trim().length > 150) {
      res.status(400).json({ error: 'email inválido' });
      return;
    }
    if (typeof password !== 'string' || password === '') {
      res.status(400).json({ error: 'password requerido' });
      return;
    }
    const resultado = await AuthService.login(email.trim(), password);
    res.json(resultado);
  } catch (error) {
    res.status(401).json({ error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
