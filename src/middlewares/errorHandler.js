/**
 * MIDDLEWARE DE MANEJO DE ERRORES
 * 
 * Responsabilidades:
 * - Capturar todos los errores de la aplicación
 * - Formatear respuestas de error consistentes
 * - Diferenciar entre errores operacionales y de programación
 * - Logging de errores
 * - Ocultar detalles sensibles en producción
 * 
 * DECISIÓN ARQUITECTÓNICA:
 * Este middleware es el último en la cadena de Express.
 * Captura cualquier error lanzado con next(error) desde cualquier capa.
 * Proporciona respuestas HTTP consistentes y manejables por el cliente.
 */

import { AppError } from '../utils/errors.js';

/**
 * Middleware principal de manejo de errores
 */
export const errorHandler = (err, req, res, next) => {
  // Log del error (en producción usarías un logger como Winston o Pino)
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Si es un error operacional conocido
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      }
    });
  }

  // Errores de validación de Supabase
  if (err.code && err.code.startsWith('PGRST')) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Error en la operación de base de datos',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        statusCode: 400
      }
    });
  }

  // Errores de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'JSON inválido en la petición',
        statusCode: 400
      }
    });
  }

  // Error genérico no controlado
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err
      })
    }
  });
};

/**
 * Middleware para rutas no encontradas (404)
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Ruta no encontrada: ${req.method} ${req.path}`,
      statusCode: 404
    }
  });
};

/**
 * Wrapper para funciones async en routes
 * Captura errores automáticamente sin necesidad de try-catch
 * 
 * Uso:
 * router.get('/ruta', asyncHandler(async (req, res) => {
 *   const data = await service.getData();
 *   res.json(data);
 * }));
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
