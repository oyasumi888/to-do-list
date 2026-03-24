import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db/pool.js';
import { AuthService } from './services/auth.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas
// import userRoutes from './routes/users';
// app.use('/api/users', userRoutes);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');           
    res.json({ status: 'ok', db: 'conectado' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'sin conexión', error });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.post('/auth/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const usuario = await AuthService.register(nombre, email, password);
    res.json(usuario);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

// Login temporal para pruebas
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const resultado = await AuthService.login(email, password);
    res.json(resultado);
  } catch (error) {
    res.status(401).json({ error: String(error) });
  }
});