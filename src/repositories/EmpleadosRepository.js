/**
 * EMPLEADOS REPOSITORY
 * 
 * Repository para la entidad Empleados.
 * 
 * Estructura de la tabla 'empleados':
 * - usuario_id (uuid, primary key, FK a auth.users)
 * - numero_empleado (text, nullable, UNIQUE)
 * - fecha_contratacion (date, nullable)
 * - departamento (text, nullable)
 * - activo (boolean, DEFAULT true)
 * - creado_en (timestamp with time zone, DEFAULT now())
 */

import database from '../config/database.js';
import { DatabaseError } from '../utils/errors.js';

export class EmpleadosRepository {
  constructor(db = database) {
    this.tableName = 'empleados';
    this.idColumn = 'usuario_id';
    this.db = db;
  }

  /**
   * Obtiene todos los empleados
   * @returns {Promise<Array>}
   */
  async getAllEmpleados(options = {}) {
    try {
      let query = this.db
        .getClient()
        .from(this.tableName)
        .select('*');

      if (options.activos !== undefined) {
        query = query.eq('activo', options.activos);
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending !== false });
      } else {
        query = query.order('creado_en', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(`Error fetching empleados: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getAllEmpleados: ${error.message}`);
    }
  }

  /**
   * Obtiene un empleado por usuario_id
   * @param {string} usuarioId - UUID del usuario
   * @returns {Promise<Object|null>}
   */
  async getEmpleadoByUsuarioId(usuarioId) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select('*')
        .eq('usuario_id', usuarioId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Error fetching empleado: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getEmpleadoByUsuarioId: ${error.message}`);
    }
  }

  /**
   * Obtiene un empleado por numero_empleado
   * @param {string} numeroEmpleado
   * @returns {Promise<Object|null>}
   */
  async getEmpleadoByNumero(numeroEmpleado) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select('*')
        .eq('numero_empleado', numeroEmpleado)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Error fetching empleado: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getEmpleadoByNumero: ${error.message}`);
    }
  }

  /**
   * Crea un nuevo empleado
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createEmpleado(data) {
    try {
      const { data: empleado, error } = await this.db
        .getClient()
        .from(this.tableName)
        .insert([data])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new DatabaseError('Ya existe un empleado con ese número de empleado');
        }
        throw new DatabaseError(`Error creating empleado: ${error.message}`);
      }

      return empleado;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in createEmpleado: ${error.message}`);
    }
  }

  /**
   * Actualiza un empleado
   * @param {string} usuarioId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateEmpleado(usuarioId, updateData) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .update(updateData)
        .eq('usuario_id', usuarioId)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new DatabaseError('Ya existe un empleado con ese número de empleado');
        }
        throw new DatabaseError(`Error updating empleado: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in updateEmpleado: ${error.message}`);
    }
  }

  /**
   * Elimina un empleado (y sus roles por cascada)
   * @param {string} usuarioId
   * @returns {Promise<Object>}
   */
  async deleteEmpleado(usuarioId) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .delete()
        .eq('usuario_id', usuarioId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Error deleting empleado: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in deleteEmpleado: ${error.message}`);
    }
  }

  /**
   * Obtiene empleado con sus roles asignados
   * @param {string} usuarioId
   * @returns {Promise<Object|null>}
   */
  async getEmpleadoWithRoles(usuarioId) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select(`
          *,
          empleados_roles (
            id,
            rol_id,
            otorgado_por,
            otorgado_en,
            roles (
              id,
              nombre,
              descripcion
            )
          )
        `)
        .eq('usuario_id', usuarioId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Error fetching empleado with roles: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getEmpleadoWithRoles: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los empleados con sus roles
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  async getAllEmpleadosWithRoles(options = {}) {
    try {
      let query = this.db
        .getClient()
        .from(this.tableName)
        .select(`
          *,
          empleados_roles (
            id,
            rol_id,
            otorgado_por,
            otorgado_en,
            roles (
              id,
              nombre,
              descripcion
            )
          )
        `);

      if (options.activos !== undefined) {
        query = query.eq('activo', options.activos);
      }

      query = query.order('creado_en', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(`Error fetching empleados with roles: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getAllEmpleadosWithRoles: ${error.message}`);
    }
  }
}

export default new EmpleadosRepository();
