/**
 * CARRITO REPOSITORY
 * 
 * Repository para la entidad Carrito de Compras.
 * 
 * Estructura de las tablas:
 * 
 * carritos:
 * - id (bigint, primary key)
 * - usuario_id (bigint, FK a usuarios)
 * - fecha_creacion (timestamp with time zone, default now())
 * 
 * detalles_carritos:
 * - id (bigint, primary key)
 * - carrito_id (bigint, FK a carritos)
 * - producto_id (bigint, FK a productos)
 * - cantidad (integer)
 */

import { BaseRepository } from './BaseRepository.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';

export class CarritoRepository extends BaseRepository {
  constructor() {
    super('carritos');
  }

  /**
   * Encuentra el carrito de un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Object|null>}
   */
  async findByUsuario(usuarioId) {
    try {
      return await this.findOne({ usuario_id: usuarioId });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene o crea un carrito para un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Object>}
   */
  async getOrCreateCarrito(usuarioId) {
    try {
      let carrito = await this.findByUsuario(usuarioId);
      
      if (!carrito) {
        carrito = await this.create({ usuario_id: usuarioId });
      }

      return carrito;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un carrito con todos sus detalles y productos
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Object|null>}
   */
  async getCarritoConDetalles(usuarioId) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select(`
          id,
          usuario_id,
          fecha_creacion,
          detalles_carritos (
            id,
            cantidad,
            productos (
              id,
              nombre,
              descripcion,
              precio,
              stock,
              id_categoria
            )
          )
        `)
        .eq('usuario_id', usuarioId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(`Error fetching carrito with details: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getCarritoConDetalles: ${error.message}`);
    }
  }

  /**
   * Agrega un producto al carrito
   * @param {number} carritoId - ID del carrito
   * @param {number} productoId - ID del producto
   * @param {number} cantidad - Cantidad a agregar
   * @returns {Promise<Object>}
   */
  async agregarProducto(carritoId, productoId, cantidad) {
    try {
      // Verificar si el producto ya está en el carrito
      const { data: existing, error: findError } = await this.db
        .getClient()
        .from('detalles_carritos')
        .select('*')
        .eq('carrito_id', carritoId)
        .eq('producto_id', productoId)
        .single();

      if (existing) {
        // Actualizar cantidad si ya existe
        const { data, error } = await this.db
          .getClient()
          .from('detalles_carritos')
          .update({ cantidad: existing.cantidad + cantidad })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw new DatabaseError(`Error updating cart item: ${error.message}`);
        return data;
      } else {
        // Crear nuevo detalle
        const { data, error } = await this.db
          .getClient()
          .from('detalles_carritos')
          .insert({
            carrito_id: carritoId,
            producto_id: productoId,
            cantidad
          })
          .select()
          .single();

        if (error) throw new DatabaseError(`Error adding product to cart: ${error.message}`);
        return data;
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in agregarProducto: ${error.message}`);
    }
  }

  /**
   * Actualiza la cantidad de un producto en el carrito
   * @param {number} detalleId - ID del detalle del carrito
   * @param {number} cantidad - Nueva cantidad
   * @returns {Promise<Object>}
   */
  async actualizarCantidad(detalleId, cantidad) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from('detalles_carritos')
        .update({ cantidad })
        .eq('id', detalleId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Detalle de carrito no encontrado');
        }
        throw new DatabaseError(`Error updating quantity: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un producto del carrito
   * @param {number} detalleId - ID del detalle del carrito
   * @returns {Promise<boolean>}
   */
  async eliminarProducto(detalleId) {
    try {
      const { error } = await this.db
        .getClient()
        .from('detalles_carritos')
        .delete()
        .eq('id', detalleId);

      if (error) throw new DatabaseError(`Error removing product: ${error.message}`);
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vacía el carrito eliminando todos sus detalles
   * @param {number} carritoId - ID del carrito
   * @returns {Promise<boolean>}
   */
  async vaciarCarrito(carritoId) {
    try {
      const { error } = await this.db
        .getClient()
        .from('detalles_carritos')
        .delete()
        .eq('carrito_id', carritoId);

      if (error) throw new DatabaseError(`Error clearing cart: ${error.message}`);
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calcula el total del carrito
   * @param {number} carritoId - ID del carrito
   * @returns {Promise<number>}
   */
  async calcularTotal(carritoId) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from('detalles_carritos')
        .select(`
          cantidad,
          productos (precio)
        `)
        .eq('carrito_id', carritoId);

      if (error) throw new DatabaseError(`Error calculating total: ${error.message}`);

      const total = (data || []).reduce((sum, item) => {
        return sum + (item.cantidad * parseFloat(item.productos.precio));
      }, 0);

      return total;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in calcularTotal: ${error.message}`);
    }
  }
}

// Exportar instancia singleton
export default new CarritoRepository();
