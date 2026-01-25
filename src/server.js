/**
 * SERVER.JS - Punto de entrada de la aplicación
 * 
 * Responsabilidades:
 * - Iniciar el servidor HTTP
 * - Verificar conexión con la base de datos
 * - Manejo de señales de terminación (graceful shutdown)
 * 
 * DECISIÓN ARQUITECTÓNICA:
 * Separar app.js (configuración) de server.js (inicio) permite:
 * 1. Testing de la app sin iniciar el servidor
 * 2. Reutilizar la app en diferentes contextos
 * 3. Facilitar despliegues en diferentes entornos
 */

import app from './app.js';
import database from './config/database.js';

// Configuración del puerto
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Variable para almacenar la instancia del servidor
let server;

/**
 * Inicia el servidor
 */
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor...');
    console.log(`📦 Entorno: ${NODE_ENV}`);

    // Verificar conexión con la base de datos
    console.log('🔌 Verificando conexión con Supabase...');
    const isConnected = await database.checkConnection();
    
    if (!isConnected) {
      console.warn('⚠️  No se pudo verificar la conexión con Supabase');
      console.warn('⚠️  El servidor se iniciará de todas formas, pero las operaciones de BD pueden fallar');
    } else {
      console.log('✅ Conexión con Supabase establecida');
    }

    // Iniciar servidor HTTP
    server = app.listen(PORT, () => {
      console.log('✅ Servidor iniciado correctamente');
      console.log(`🌐 Servidor escuchando en: http://localhost:${PORT}`);
      console.log(`📚 Documentación API: http://localhost:${PORT}/api/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Presiona CTRL+C para detener el servidor');
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

/**
 * Maneja el cierre graceful del servidor
 */
function gracefulShutdown(signal) {
  console.log(`\n⚠️  Señal ${signal} recibida`);
  console.log('🛑 Cerrando servidor gracefully...');

  if (server) {
    server.close(() => {
      console.log('✅ Servidor cerrado correctamente');
      console.log('👋 Adiós!');
      process.exit(0);
    });

    // Forzar cierre después de 10 segundos
    setTimeout(() => {
      console.error('⚠️  Forzando cierre del servidor');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

/**
 * Maneja errores no capturados
 */
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Señales de terminación
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Iniciar el servidor
startServer();