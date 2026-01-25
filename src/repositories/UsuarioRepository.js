/**
 * USUARIO REPOSITORY
 * 
 * Repository para la entidad Usuario.
 * 
 * Estructura de la tabla 'usuarios':
 * - id (bigint, primary key, GENERATED ALWAYS AS IDENTITY)
 * - auth_user_id (uuid, NOT NULL, FK a auth.users de Supabase)
 * - nombre (text, NOT NULL)
 * - email (text, NOT NULL, UNIQUE)
 * - direccion (text, nullable)
 * - telefono (text, nullable)
 */

import { BaseRepository } from './BaseRepository.js';
import { DatabaseError } from '../utils/errors.js';

export class UsuarioRepository extends BaseRepository {
  constructor() {
    super('usuarios');
  }

  /**
   * Encuentra un usuario por su email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    try {
      return await this.findOne({ email });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Encuentra un usuario por su auth_user_id de Supabase
   * @param {string} authUserId - UUID del usuario en auth.users
   * @returns {Promise<Object|null>}
   */
  async findByAuthUserId(authUserId) {
    try {
      return await this.findOne({ auth_user_id: authUserId });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo usuario asociado a una cuenta de autenticación
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.auth_user_id - UUID de auth.users
   * @param {string} userData.nombre - Nombre del usuario
   * @param {string} userData.email - Email del usuario
   * @param {string} [userData.direccion] - Dirección opcional
   * @param {string} [userData.telefono] - Teléfono opcional
   * @returns {Promise<Object>}
   */
  async createFromAuth(userData) {
    try {
      return await this.create({
        auth_user_id: userData.auth_user_id,
        nombre: userData.nombre,
        email: userData.email,
        direccion: userData.direccion || null,
        telefono: userData.telefono || null
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un usuario con sus pedidos
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Object|null>}
   */
  async findWithPedidos(usuarioId) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select(`
          *,
          pedidos (
            id,
            fecha,
            total
          )
        `)
        .eq('id', usuarioId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Error fetching user with orders: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in findWithPedidos: ${error.message}`);
    }
  }

  /**
   * Actualiza la información de contacto de un usuario
   * @param {number} usuarioId - ID del usuario
   * @param {Object} contactData - Datos de contacto
   * @returns {Promise<Object>}
   */
  async updateContactInfo(usuarioId, contactData) {
    try {
      const updateData = {};
      if (contactData.direccion !== undefined) updateData.direccion = contactData.direccion;
      if (contactData.telefono !== undefined) updateData.telefono = contactData.telefono;

      return await this.update(usuarioId, updateData);
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export default new UsuarioRepository();
