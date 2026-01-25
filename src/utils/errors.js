/**
 * CLASES DE ERRORES PERSONALIZADOS
 * 
 * Permiten identificar diferentes tipos de errores en la aplicación
 * y manejarlos de forma específica en el middleware de errores.
 */

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Errores operacionales vs errores de programación
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Error de validación') {
    super(message, 400);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Error en la base de datos') {
    super(message, 500);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso prohibido') {
    super(message, 403);
  }
}
