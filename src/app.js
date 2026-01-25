/**
 * APP.JS - Configuración de Express
 * 
 * Este archivo configura la aplicación Express con todos sus middlewares,
 * rutas y manejadores de errores.
 * 
 * Separa la configuración de la aplicación (app.js) del inicio del servidor (server.js)
 * para facilitar testing y reutilización.
 */

import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { requestLogger, corsMiddleware } from './middlewares/logger.js';

// Cargar variables de entorno
dotenv.config();

// Crear instancia de Express
const app = express();

// ============ MIDDLEWARES GLOBALES ============

// CORS (debe ir primero)
app.use(corsMiddleware);

// Logger de peticiones
app.use(requestLogger);

// Body parser para JSON
app.use(express.json());

// Body parser para URL-encoded (formularios)
app.use(express.urlencoded({ extended: true }));

// ============ RUTAS ============

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bello Amuleto API',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Registrar todas las rutas bajo /api
app.use('/api', routes);

// ============ MANEJO DE ERRORES ============

// 404 - Ruta no encontrada (debe ir después de todas las rutas)
app.use(notFoundHandler);

// Error handler global (debe ser el último middleware)
app.use(errorHandler);

export default app;
