# To-Do List

Sistema de gestión de tareas con soporte para categorías y etiquetas. Permite a los usuarios crear, organizar y filtrar tareas con fechas límite y estados, desarrollado como proyecto de la materia Administración de Proyectos de Software (UAG, 8º semestre).

## Requisitos previos

Asegúrate de tener instalado lo siguiente antes de continuar:

- [Node.js](https://nodejs.org/) v18 o superior
- [PostgreSQL](https://www.postgresql.org/) v14 o superior
- [Git](https://git-scm.com/)

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/to-do-list.git
cd to-do-list
```

### 2. Configurar el backend

```bash
cd backend
npm install
```

Crea el archivo `.env` en la carpeta `backend/` con las siguientes variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=to_do_list
DB_USER=list_user
DB_PASSWORD=tu_password
PORT=3000
```

### 3. Configurar el frontend

```bash
cd ../frontend
npm install
```

## Cómo correr el proyecto

### Backend

```bash
cd backend
npm run dev
```

El servidor estará disponible en `http://localhost:3000`. Puedes verificar que funciona correctamente en `http://localhost:3000/health`.

### Frontend

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL |
| Control de versiones | GitHub |