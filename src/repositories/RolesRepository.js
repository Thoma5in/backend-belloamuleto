/**
 * ROLES REPOSITORY
 * 
 * Repository para la entidad Roles.
 * 
 * Estructura de la tabla 'roles':
 * - id (uuid, primary key, DEFAULT gen_random_uuid())
 * - nombre (text, NOT NULL, UNIQUE)
 * - descripcion (text, nullable)
 * - creado_en (timestamp with time zone, DEFAULT now())
 */

import { BaseRepository } from './BaseRepository.js';
import { DatabaseError } from '../utils/errors.js';

export class RolesRepository extends BaseRepository {
  constructor() {
    super('roles', { idColumn: 'id' });
  }

  /**
   * Encuentra un rol por su nombre
   * @param {string} nombre - Nombre del rol
   * @returns {Promise<Object|null>}
   */
  async findByNombre(nombre) {
    try {
      return await this.findOne({ nombre });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todos los roles ordenados alfabéticamente
   * @returns {Promise<Array>}
   */
  async getAllRoles() {
    try {
      return await this.findAll({
        orderBy: 'nombre',
        ascending: true
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un rol por su ID
   * @param {string} idRol - ID del rol (UUID)
   * @returns {Promise<Object|null>}
   */
  async getRolById(idRol) {
    try {
      return await this.findById(idRol);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo rol
   * @param {Object} data
   * @param {string} data.nombre
   * @param {string} [data.descripcion]
   * @returns {Promise<Object>}
   */
  async createRol(data) {
    try {
      return await this.create(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un rol
   * @param {string} idRol - ID del rol (UUID)
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateRol(idRol, updateData) {
    try {
      return await this.update(idRol, updateData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un rol
   * @param {string} idRol - ID del rol (UUID)
   * @returns {Promise<Object>}
   */
  async deleteRol(idRol) {
    try {
      return await this.delete(idRol);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un rol con los usuarios asociados
   * @param {string} idRol - ID del rol (UUID)
   * @returns {Promise<Object|null>}
   */
  async getRolWithUsers(idRol) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select(`
          *,
          usuarios_roles (
            id,
            usuario_id,
            otorgado_en
          )
        `)
        .eq('id', idRol)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Error fetching role with users: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getRolWithUsers: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los roles con sus usuarios asociados
   * @returns {Promise<Array>}
   */
  async getAllRolesWithUsers() {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select(`
          *,
          usuarios_roles (
            id,
            usuario_id,
            otorgado_en
          )
        `)
        .order('nombre');

      if (error) {
        throw new DatabaseError(`Error fetching roles with users: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getAllRolesWithUsers: ${error.message}`);
    }
  }
}

export default new RolesRepository();
