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
 * - estado (smallint, default 1) -- 1: activo, 2: convertido a pedido, 3: abandonado
 * 
 * detalles_carritos:
 * - id (bigint, primary key)
 * - carrito_id (bigint, FK a carritos)
 * - producto_id (bigint, FK a productos)
 * - cantidad (integer)
 * - UNIQUE CONSTRAINT (carrito_id, producto_id) -- evita duplicados
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
   * Obtiene o crea un carrito activo para un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Object>}
   */
  async getOrCreateCarrito(usuarioId) {
    try {
      // Buscar carrito activo (estado = 1)
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('estado', 1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(`Error finding active cart: ${error.message}`);
      }

      if (data) {
        return data;
      }

      // Crear nuevo carrito activo
      const carrito = await this.create({ 
        usuario_id: usuarioId,
        estado: 1 
      });

      return carrito;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Unexpected error in getOrCreateCarrito: ${error.message}`);
    }
  }

  /**
   * Obtiene un carrito activo con todos sus detalles y productos
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
          estado,
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
        .eq('estado', 1)
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
   * Agrega un producto al carrito (o incrementa cantidad si ya existe)
   * Usa UPSERT aprovechando la UNIQUE constraint (carrito_id, producto_id)
   * @param {number} carritoId - ID del carrito
   * @param {number} productoId - ID del producto
   * @param {number} cantidad - Cantidad a agregar
   * @returns {Promise<Object>}
   */
  async agregarProducto(carritoId, productoId, cantidad) {
    try {
      // Primero intentar obtener el detalle existente
      const { data: existing } = await this.db
        .getClient()
        .from('detalles_carritos')
        .select('*')
        .eq('carrito_id', carritoId)
        .eq('producto_id', productoId)
        .maybeSingle();

      if (existing) {
        // Si existe, incrementar la cantidad
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
        // Si no existe, insertar nuevo
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
   * Cambia el estado del carrito
   * @param {number} carritoId - ID del carrito
   * @param {number} nuevoEstado - Nuevo estado (1: activo, 2: convertido a pedido, 3: abandonado)
   * @returns {Promise<Object>}
   */
  async cambiarEstado(carritoId, nuevoEstado) {
    try {
      const { data, error } = await this.db
        .getClient()
        .from(this.tableName)
        .update({ estado: nuevoEstado })
        .eq('id', carritoId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Carrito no encontrado');
        }
        throw new DatabaseError(`Error changing cart state: ${error.message}`);
      }

      return data;
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
