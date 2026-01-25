/**
 * CAPA DE CONFIGURACIÓN / INFRASTRUCTURE
 * 
 * Esta capa es responsable de:
 * - Inicializar conexiones con infraestructura externa (base de datos, cache, etc.)
 * - Gestionar configuraciones de entorno
 * - Proveer clientes singleton para ser consumidos por repositories
 * - Abstraer los detalles de implementación del proveedor
 * 
 * DECISIÓN ARQUITECTÓNICA:
 * database.js actúa como un adaptador/wrapper sobre el cliente de Supabase.
 * Esto permite cambiar el proveedor de base de datos sin afectar al resto del código.
 */

import supabase from './supabase.js';

class Database {
  constructor() {
    this.client = supabase;
  }

  /**
   * Obtiene el cliente de base de datos
   * @returns {Object} Cliente de Supabase
   */
  getClient() {
    return this.client;
  }

  /**
   * Verifica la conexión con la base de datos
   * @returns {Promise<boolean>}
   */
  async checkConnection() {
    try {
      const { error } = await this.client.from('_health_check').select('*').limit(1);
      if (error && error.code !== '42P01') { // 42P01 = tabla no existe (es OK para health check)
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  /**
   * Método para ejecutar queries personalizadas si es necesario
   * Esto puede ser útil para migraciones futuras a otro proveedor
   */
  async query(table) {
    return this.client.from(table);
  }
}

// Singleton: una sola instancia de Database en toda la aplicación
const database = new Database();

export default database;
