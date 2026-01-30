/**
 * CAPA DE REPOSITORIES (Data Access Layer)
 * 
 * Responsabilidades:
 * - Única capa que interactúa directamente con la base de datos
 * - Métodos CRUD genéricos y específicos
 * - Manejo de queries y transformaciones de datos a nivel de persistencia
 * - NO contiene lógica de negocio
 * 
 * DECISIÓN ARQUITECTÓNICA:
 * BaseRepository implementa operaciones CRUD comunes que heredarán
 * todos los repositories específicos. Esto promueve DRY y facilita
 * el cambio de proveedor de base de datos en el futuro.
 * 
 * Si cambias de Supabase a PostgreSQL directo o MongoDB, solo necesitas
 * modificar esta capa, manteniendo la misma interfaz pública.
 */

import database from '../config/database.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';

export class BaseRepository {
  constructor(tableName, options = {}) {
    if (!tableName) {
      throw new Error('Table name is required for repository');
    }

    // Backwards-compatible options parsing:
    // - old signature: new BaseRepository('table')
    // - new signature: new BaseRepository('table', { idColumn: 'id_categoria' })
    // - allow passing string as idColumn: new BaseRepository('table', 'id')
    const normalizedOptions =
      typeof options === 'string' ? { idColumn: options } : (options || {});

    this.tableName = tableName;
    this.idColumn = normalizedOptions.idColumn || 'id';
    this.db = database;
  }

  /**
   * Encuentra todos los registros con opciones de filtrado, ordenamiento y paginación
   * @param {Object} options - Opciones de consulta
   * @param {Object} options.filters - Filtros a aplicar { column: value }
   * @param {string} options.orderBy - Campo por el cual ordenar
   * @param {boolean} options.ascending - Orden ascendente o descendente
   * @param {number} options.limit - Límite de registros
   * @param {number} options.offset - Desplazamiento para paginación
   * @returns {Promise<Array>}
   */
  async findAll(options = {}) {
    try {
      const { filters = {}, orderBy = this.idColumn, ascending = false, limit, offset } = options;

      let query = this.db.getClient().from(this.tableName).select('*');

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Aplicar ordenamiento
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      // Aplicar paginación
      if (limit) {
        query = query.limit(limit);
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(`Error fetching ${this.tableName}: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in findAll: ${error.message}`);
    }
  }

  /**
   * Encuentra un registro por ID
   * @param {string|number} id - ID del registro
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select('*')
        .eq(this.idColumn, id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw new DatabaseError(`Error fetching ${this.tableName} by ID: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in findById: ${error.message}`);
    }
  }

  /**
   * Encuentra un registro por condiciones específicas
   * @param {Object} conditions - Condiciones de búsqueda { column: value }
   * @returns {Promise<Object|null>}
   */
  async findOne(conditions) {
    try {
      let query = this.db.getClient().from(this.tableName).select('*');

      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Error in findOne: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in findOne: ${error.message}`);
    }
  }

  /**
   * Crea un nuevo registro
   * @param {Object} data - Datos del registro a crear
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      const { data: created, error } = await this.db
        .getClient()
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Error creating ${this.tableName}: ${error.message}`);
      }

      return created;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in create: ${error.message}`);
    }
  }

  /**
   * Actualiza un registro por ID
   * @param {string|number} id - ID del registro
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    try {
      const { data: updated, error } = await this.db
        .getClient()
        .from(this.tableName)
        .update(data)
        .eq(this.idColumn, id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`${this.tableName} with ID ${id} not found`);
        }
        throw new DatabaseError(`Error updating ${this.tableName}: ${error.message}`);
      }

      return updated;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Unexpected error in update: ${error.message}`);
    }
  }

  /**
   * Elimina un registro por ID (soft delete si la tabla tiene 'deleted_at')
   * @param {string|number} id - ID del registro
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      // Intenta hacer soft delete primero
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq(this.idColumn, id)
        .select()
        .single();

      // Si no hay columna deleted_at, hacer hard delete
      if (error && error.message.includes('column')) {
        const { error: deleteError } = await this.db
          .getClient()
          .from(this.tableName)
          .delete()
          .eq(this.idColumn, id);

        if (deleteError) {
          throw new DatabaseError(`Error deleting ${this.tableName}: ${deleteError.message}`);
        }
        return true;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`${this.tableName} with ID ${id} not found`);
        }
        throw new DatabaseError(`Error deleting ${this.tableName}: ${error.message}`);
      }

      return true;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Unexpected error in delete: ${error.message}`);
    }
  }

  /**
   * Cuenta registros con filtros opcionales
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    try {
      let query = this.db.getClient().from(this.tableName).select('*', { count: 'exact', head: true });

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;

      if (error) {
        throw new DatabaseError(`Error counting ${this.tableName}: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in count: ${error.message}`);
    }
  }
}
