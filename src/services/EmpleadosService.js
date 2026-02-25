/**
 * CAPA DE SERVICES (Business Logic Layer)
 *
 * Gestión de Empleados
 */

import database from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class EmpleadosService {
  constructor(db = database) {
    this.db = db;
    this.tableName = 'empleados';
  }

  /**
   * Obtiene todos los empleados
   * @param {Object} options
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

      query = query.order('creado_en', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un empleado por usuario_id
   * @param {string} usuarioId
   * @returns {Promise<Object>}
   */
  async getEmpleadoByUsuarioId(usuarioId) {
    this.validateId(usuarioId);

    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select('*')
        .eq('usuario_id', usuarioId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Empleado no encontrado`);
        }
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw error;
    }
  }

  /**
   * Crea un nuevo empleado
   * @param {Object} data
   */
  async createEmpleado(data) {
    this.validateEmpleadoData(data);
    this.validateId(data.usuario_id);

    try {
      const existing = await this.getEmpleadoByUsuarioId(data.usuario_id);
      throw new ValidationError('Ya existe un empleado con este usuario');
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        if (error instanceof ValidationError) throw error;
        throw error;
      }
    }

    if (data.numero_empleado) {
      try {
        const { data: existing } = await this.db
          .getClient()
          .from(this.tableName)
          .select('usuario_id')
          .eq('numero_empleado', data.numero_empleado)
          .single();

        if (existing) {
          throw new ValidationError('Ya existe un empleado con ese número');
        }
      } catch (error) {
        if (error instanceof ValidationError) throw error;
      }
    }

    try {
      const { data: empleado, error } = await this.db
        .getClient()
        .from(this.tableName)
        .insert([{
          usuario_id: data.usuario_id,
          numero_empleado: data.numero_empleado || null,
          fecha_contratacion: data.fecha_contratacion || null,
          departamento: data.departamento || null,
          activo: data.activo !== false
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Error: ${error.message}`);
      }

      return empleado;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un empleado
   * @param {string} usuarioId
   * @param {Object} updateData
   */
  async updateEmpleado(usuarioId, updateData) {
    this.validateId(usuarioId);

    await this.getEmpleadoByUsuarioId(usuarioId);

    const normalized = { ...updateData };
    delete normalized.usuario_id;
    delete normalized.creado_en;

    if (normalized.numero_empleado) {
      try {
        const { data: otro } = await this.db
          .getClient()
          .from(this.tableName)
          .select('usuario_id')
          .eq('numero_empleado', normalized.numero_empleado)
          .single();

        if (otro && otro.usuario_id !== usuarioId) {
          throw new ValidationError('Ya existe otro empleado con ese número');
        }
      } catch (error) {
        if (error instanceof ValidationError) throw error;
      }
    }

    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .update(normalized)
        .eq('usuario_id', usuarioId)
        .select()
        .single();

      if (error) {
        throw new Error(`Error: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un empleado
   * @param {string} usuarioId
   */
  async deleteEmpleado(usuarioId) {
    this.validateId(usuarioId);

    await this.getEmpleadoByUsuarioId(usuarioId);

    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .delete()
        .eq('usuario_id', usuarioId)
        .select()
        .single();

      if (error) {
        throw new Error(`Error: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene empleado con sus roles
   * @param {string} usuarioId
   */
  async getEmpleadoWithRoles(usuarioId) {
    this.validateId(usuarioId);

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
          throw new NotFoundError(`Empleado no encontrado`);
        }
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw error;
    }
  }

  /**
   * Obtiene todos los empleados con sus roles
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
        throw new Error(`Error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  validateEmpleadoData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Los datos deben ser un objeto');
    }

    if (!data.usuario_id) {
      throw new ValidationError('El campo usuario_id es requerido');
    }
  }

  validateId(id) {
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw new ValidationError('El ID debe ser válido');
    }
  }
}

export default new EmpleadosService();
