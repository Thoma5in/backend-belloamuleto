/**
 * EMPLEADOS_ROLES REPOSITORY
 * 
 * Repository para la entidad de relación Empleados-Roles.
 * 
 * Estructura de la tabla 'empleados_roles':
 * - id (uuid, primary key, DEFAULT gen_random_uuid())
 * - empleado_id (uuid, FK a empleados.usuario_id, NOT NULL)
 * - rol_id (uuid, FK a roles, NOT NULL)
 * - otorgado_por (uuid, FK a auth.users, nullable)
 * - otorgado_en (timestamp with time zone, DEFAULT now())
 * - UNIQUE constraint: (empleado_id, rol_id)
 */

import database from '../config/database.js';
import { DatabaseError } from '../utils/errors.js';

export class EmpleadosRolesRepository {
  constructor(db = database) {
    this.tableName = 'empleados_roles';
    this.idColumn = 'id';
    this.db = db;
  }

  /**
   * Asigna un rol a un empleado
   * @param {Object} data
   * @param {string} data.empleado_id - UUID del empleado
   * @param {string} data.rol_id - UUID del rol
   * @param {string} [data.otorgado_por] - UUID de quien otorga el rol
   * @returns {Promise<Object>}
   */
  async asignarRol(data) {
    try {
      return await this.create(data);
    } catch (error) {
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        throw new DatabaseError('El empleado ya tiene asignado este rol');
      }
      throw error;
    }
  }

  /**
   * Crea una asignación de rol
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      const { data: resultado, error } = await this.db
        .getClient()
        .from(this.tableName)
        .insert([data])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new DatabaseError('El empleado ya tiene asignado este rol');
        }
        throw new DatabaseError(`Error creating assignment: ${error.message}`);
      }

      return resultado;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in create: ${error.message}`);
    }
  }

  /**
   * Revoca un rol de un empleado
   * @param {string} empleadoId - UUID del empleado
   * @param {string} rolId - UUID del rol
   * @returns {Promise<Object>}
   */
  async revocarRol(empleadoId, rolId) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .delete()
        .eq('empleado_id', empleadoId)
        .eq('rol_id', rolId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Error revoking role: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in revocarRol: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los roles asignados a un empleado
   * @param {string} empleadoId - UUID del empleado
   * @returns {Promise<Array>}
   */
  async getRolesByEmpleado(empleadoId) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select(`
          *,
          roles (
            id,
            nombre,
            descripcion
          )
        `)
        .eq('empleado_id', empleadoId)
        .order('otorgado_en', { ascending: false });

      if (error) {
        throw new DatabaseError(`Error fetching roles: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getRolesByEmpleado: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los empleados que tienen un rol específico
   * @param {string} rolId - UUID del rol
   * @returns {Promise<Array>}
   */
  async getEmpleadosByRol(rolId) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select('*')
        .eq('rol_id', rolId)
        .order('otorgado_en', { ascending: false });

      if (error) {
        throw new DatabaseError(`Error fetching empleados: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getEmpleadosByRol: ${error.message}`);
    }
  }

  /**
   * Verifica si un empleado tiene un rol específico
   * @param {string} empleadoId - UUID del empleado
   * @param {string} rolId - UUID del rol
   * @returns {Promise<boolean>}
   */
  async empleadoTieneRol(empleadoId, rolId) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select('id')
        .eq('empleado_id', empleadoId)
        .eq('rol_id', rolId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
        }
        throw new DatabaseError(`Error verifying role: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in empleadoTieneRol: ${error.message}`);
    }
  }

  /**
   * Obtiene todas las asignaciones de roles
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  async getAllAsignaciones(options = {}) {
    try {
      let query = this.db
        .getClient()
        .from(this.tableName)
        .select(`
          *,
          roles (
            id,
            nombre,
            descripcion
          )
        `);

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      query = query.order('otorgado_en', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(`Error fetching assignments: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getAllAsignaciones: ${error.message}`);
    }
  }

  /**
   * Revoca todos los roles de un empleado
   * @param {string} empleadoId - UUID del empleado
   * @returns {Promise<Array>}
   */
  async revocarTodosLosRoles(empleadoId) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .delete()
        .eq('empleado_id', empleadoId)
        .select();

      if (error) {
        throw new DatabaseError(`Error revoking all roles: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in revocarTodosLosRoles: ${error.message}`);
    }
  }

  /**
   * Asigna múltiples roles a un empleado
   * @param {string} empleadoId - UUID del empleado
   * @param {Array<string>} rolesIds - Array de UUIDs de roles
   * @param {string} [otorgadoPor] - UUID de quien otorga
   * @returns {Promise<Array>}
   */
  async asignarMultiplesRoles(empleadoId, rolesIds, otorgadoPor = null) {
    try {
      const asignaciones = rolesIds.map(rolId => ({
        empleado_id: empleadoId,
        rol_id: rolId,
        otorgado_por: otorgadoPor
      }));

      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .insert(asignaciones)
        .select();

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          throw new DatabaseError('Uno o más roles ya están asignados al empleado');
        }
        throw new DatabaseError(`Error assigning roles: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in asignarMultiplesRoles: ${error.message}`);
    }
  }
}

export default new EmpleadosRolesRepository();
