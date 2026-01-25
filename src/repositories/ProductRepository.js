/**
 * PRODUCT REPOSITORY
 * 
 * Repository específico para la entidad Producto (productos table).
 * Adaptado al esquema real de la base de datos Bello Amuleto.
 * 
 * Estructura de la tabla 'productos' en Supabase:
 * - id (bigint, primary key, GENERATED ALWAYS AS IDENTITY)
 * - nombre (text, NOT NULL)
 * - descripcion (text, nullable)
 * - precio (numeric, NOT NULL)
 * - stock (integer, NOT NULL)
 * - id_categoria (bigint, foreign key a categorias_producto)
 * 
 * NOTA: Esta tabla NO tiene columnas de auditoría (created_at, updated_at, deleted_at)
 * NOTA: Los IDs son bigint autoincrementales, no UUIDs
 */

import { BaseRepository } from './BaseRepository.js';
import { DatabaseError, NotFoundError, ValidationError } from '../utils/errors.js';

export class ProductRepository extends BaseRepository {
  constructor() {
    super('productos'); // Nombre de la tabla en español según el esquema
  }

  /**
   * Encuentra productos por categoría
   * @param {number} idCategoria - ID de la categoría
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Array>}
   */
  async findByCategory(idCategoria, options = {}) {
    try {
      return await this.findAll({
        ...options,
        filters: { ...options.filters, id_categoria: idCategoria }
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca productos por nombre (búsqueda parcial)
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Array>}
   */
  async searchByName(searchTerm) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select('*')
        .ilike('nombre', `%${searchTerm}%`)
        .order('nombre');

      if (error) {
        throw new DatabaseError(`Error searching products: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in searchByName: ${error.message}`);
    }
  }

  /**
   * Actualiza el stock de un producto
   * @param {string} id - ID del producto
   * @param {number} quantity - Cantidad a agregar o restar
   * @returns {Promise<Object>}
   */
  async updateStock(id, quantity) {
    try {
      // Primero obtener el producto para calcular el nuevo stock
      const product = await this.findById(id);
      if (!product) {
        throw new NotFoundError(`Product with ID ${id} not found`);
      }

      const newStock = product.stock + quantity;
      
      if (newStock < 0) {
        throw new ValidationError('Stock cannot be negative');
      }

      return await this.update(id, { stock: newStock });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Encuentra productos con stock bajo
   * @param {number} threshold - Umbral de stock bajo (default: 10)
   * @returns {Promise<Array>}
   */
  async findLowStock(threshold = 10) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select('*')
        .lte('stock', threshold)
        .order('stock', { ascending: true });

      if (error) {
        throw new DatabaseError(`Error finding low stock products: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in findLowStock: ${error.message}`);
    }
  }

  /**
   * Obtiene productos con paginación y filtros avanzados
   * @param {Object} params - Parámetros de consulta
   * @returns {Promise<Object>} { products, total, page, totalPages }
   */
  async findWithPagination(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        idCategoria,
        minPrice,
        maxPrice,
        sortBy = 'id',
        sortOrder = 'desc'
      } = params;

      const offset = (page - 1) * limit;
      let query = this.db.getClient().from(this.tableName).select('*', { count: 'exact' });

      // Aplicar filtros
      if (idCategoria) query = query.eq('id_categoria', idCategoria);
      if (minPrice) query = query.gte('precio', minPrice);
      if (maxPrice) query = query.lte('precio', maxPrice);

      // Aplicar ordenamiento y paginación
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new DatabaseError(`Error in pagination query: ${error.message}`);
      }

      return {
        products: data || [],
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in findWithPagination: ${error.message}`);
    }
  }

  /**
   * Obtiene productos con sus categorías (JOIN)
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Array>}
   */
  async findWithCategories(options = {}) {
    try {
      const { limit, offset } = options;

      let query = this.db
        .getClient()
        .from(this.tableName)
        .select(`
          *,
          categorias_producto (
            id_categoria,
            nombre
          )
        `);

      if (limit) query = query.limit(limit);
      if (offset) query = query.range(offset, offset + (limit || 10) - 1);

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(`Error fetching products with categories: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in findWithCategories: ${error.message}`);
    }
  }
}

// Exportar instancia singleton
export default new ProductRepository();
