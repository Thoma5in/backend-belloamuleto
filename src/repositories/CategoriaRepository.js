/**
 * CATEGORIA REPOSITORY
 * 
 * Repository para la entidad Categoría de Productos.
 * 
 * Estructura de la tabla 'categorias_producto':
 * - id_categoria (bigint, primary key, GENERATED ALWAYS AS IDENTITY)
 * - nombre (text, NOT NULL, UNIQUE)
 */

import { BaseRepository } from './BaseRepository.js';
import { DatabaseError } from '../utils/errors.js';

export class CategoriaRepository extends BaseRepository {
  constructor() {
    super('categorias_producto', { idColumn: 'id_categoria' });
  }

  /**
   * Encuentra una categoría por su nombre
   * @param {string} nombre - Nombre de la categoría
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
   * Obtiene todas las categorías ordenadas alfabéticamente
   * @returns {Promise<Array>}
   */
  async getAllCategorias() {
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
   * Obtiene una categoría por su ID con la cantidad de productos
   * @param {number} idCategoria - ID de la categoría
   * @returns {Promise<Object|null>}
   */
  async findByIdWithProductCount(idCategoria) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select(`
          *,
          productos (count)
        `)
        .eq('id_categoria', idCategoria)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Error fetching category with product count: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in findByIdWithProductCount: ${error.message}`);
    }
  }

  /**
   * Obtiene todas las categorías con el conteo de productos
   * @returns {Promise<Array>}
   */
  async getAllWithProductCount() {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select(`
          *,
          productos (count)
        `)
        .order('nombre');

      if (error) {
        throw new DatabaseError(`Error fetching categories with counts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getAllWithProductCount: ${error.message}`);
    }
  }
}

// Exportar instancia singleton
export default new CategoriaRepository();
