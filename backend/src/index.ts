import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db/pool.js';

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