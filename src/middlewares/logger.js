/**
 * MIDDLEWARE DE LOGGER
 * 
 * Registra información de cada petición HTTP
 */

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Capturar cuando la respuesta finaliza
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

/**
 * MIDDLEWARE DE CORS (simplificado)
 * 
 * En producción deberías usar el paquete 'cors' de npm
 */
export const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};
