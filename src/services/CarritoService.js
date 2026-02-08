/**
 * CARRITO SERVICE
 * 
 * Capa de lógica de negocio para la gestión del carrito de compras.
 * 
 * Responsabilidades:
 * - Validar reglas de negocio (stock, cantidades, etc.)
 * - Orquestar operaciones entre CarritoRepository y ProductRepository
 * - Calcular totales y subtotales
 * - Transformar datos para la presentación
 */

import carritoRepository from '../repositories/CarritoRepository.js';
import productRepository from '../repositories/ProductRepository.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export class CarritoService {
  constructor(
    carritoRepo = carritoRepository,
    productRepo = productRepository
  ) {
    this.carritoRepository = carritoRepo;
    this.productRepository = productRepo;
  }

  /**
   * Obtiene el carrito activo del usuario con todos sus detalles
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Object>}
   */
  async obtenerCarritoActivo(usuarioId) {
    try {
      // Obtener o crear carrito activo
      const carrito = await this.carritoRepository.getOrCreateCarrito(usuarioId);
      
      // Obtener detalles completos
      const carritoConDetalles = await this.carritoRepository.getCarritoConDetalles(usuarioId);
      
      if (!carritoConDetalles) {
        return {
          id: carrito.id,
          usuario_id: carrito.usuario_id,
          fecha_creacion: carrito.fecha_creacion,
          estado: carrito.estado,
          items: [],
          total: 0,
          cantidad_items: 0
        };
      }

      // Calcular totales y formatear items
      const items = (carritoConDetalles.detalles_carritos || []).map(detalle => ({
        id: detalle.id,
        producto_id: detalle.productos.id,
        nombre: detalle.productos.nombre,
        descripcion: detalle.productos.descripcion,
        precio: parseFloat(detalle.productos.precio),
        precio_formateado: `$${parseFloat(detalle.productos.precio).toFixed(2)}`,
        cantidad: detalle.cantidad,
        stock_disponible: detalle.productos.stock,
        subtotal: detalle.cantidad * parseFloat(detalle.productos.precio),
        subtotal_formateado: `$${(detalle.cantidad * parseFloat(detalle.productos.precio)).toFixed(2)}`,
        tiene_stock: detalle.productos.stock >= detalle.cantidad,
        id_categoria: detalle.productos.id_categoria
      }));

      const total = items.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        id: carritoConDetalles.id,
        usuario_id: carritoConDetalles.usuario_id,
        fecha_creacion: carritoConDetalles.fecha_creacion,
        estado: carritoConDetalles.estado,
        items,
        total,
        total_formateado: `$${total.toFixed(2)}`,
        cantidad_items: items.length,
        cantidad_productos: items.reduce((sum, item) => sum + item.cantidad, 0)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Agrega un producto al carrito (o incrementa su cantidad)
   * @param {number} usuarioId - ID del usuario
   * @param {number} productoId - ID del producto
   * @param {number} cantidad - Cantidad a agregar (default: 1)
   * @returns {Promise<Object>}
   */
  async agregarProducto(usuarioId, productoId, cantidad = 1) {
    try {
      // Validar cantidad
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new ValidationError('La cantidad debe ser un número entero mayor a 0');
      }

      // Verificar que el producto existe y obtener su stock
      const producto = await this.productRepository.findById(productoId);
      if (!producto) {
        throw new NotFoundError('Producto no encontrado');
      }

      // Normalizar stock a número
      const stockDisponible = Number(producto.stock);
      if (!Number.isFinite(stockDisponible)) {
        throw new ValidationError('Stock del producto inválido');
      }

      // Obtener o crear carrito activo
      const carrito = await this.carritoRepository.getOrCreateCarrito(usuarioId);

      // Verificar stock disponible
      // Primero obtener la cantidad actual en el carrito si existe
      const carritoActual = await this.carritoRepository.getCarritoConDetalles(usuarioId);
      const detalleExistente = carritoActual?.detalles_carritos?.find(
        d => d.productos.id === productoId
      );
      
      const cantidadActualEnCarrito = detalleExistente ? detalleExistente.cantidad : 0;
      const nuevaCantidadTotal = cantidadActualEnCarrito + cantidad;

      if (nuevaCantidadTotal > stockDisponible) {
        throw new ValidationError(
          `Stock insuficiente. Disponible: ${stockDisponible}, en carrito: ${cantidadActualEnCarrito}, solicitado: ${cantidad}`
        );
      }

      // Agregar producto al carrito
      const detalleCarrito = await this.carritoRepository.agregarProducto(
        carrito.id,
        productoId,
        cantidad
      );

      // Retornar el carrito actualizado completo
      return await this.obtenerCarritoActivo(usuarioId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza la cantidad de un producto en el carrito
   * @param {number} usuarioId - ID del usuario
   * @param {number} productoId - ID del producto
   * @param {number} nuevaCantidad - Nueva cantidad
   * @returns {Promise<Object>}
   */
  async actualizarCantidadProducto(usuarioId, productoId, nuevaCantidad) {
    try {
      // Validar cantidad
      if (!Number.isInteger(nuevaCantidad) || nuevaCantidad <= 0) {
        throw new ValidationError('La cantidad debe ser un número entero mayor a 0');
      }

      // Verificar que el producto existe
      const producto = await this.productRepository.findById(productoId);
      if (!producto) {
        throw new NotFoundError('Producto no encontrado');
      }

      const stockDisponible = Number(producto.stock);
      if (!Number.isFinite(stockDisponible)) {
        throw new ValidationError('Stock del producto inválido');
      }

      // Validar stock (no se puede establecer una cantidad mayor al stock disponible)
      if (nuevaCantidad > stockDisponible) {
        throw new ValidationError(
          `Stock insuficiente. Disponible: ${stockDisponible}, solicitado: ${nuevaCantidad}`
        );
      }

      // Obtener carrito del usuario
      const carritoConDetalles = await this.carritoRepository.getCarritoConDetalles(usuarioId);
      if (!carritoConDetalles) {
        throw new NotFoundError('No se encontró un carrito activo');
      }

      // Buscar el detalle del producto en el carrito
      const detalleCarrito = carritoConDetalles.detalles_carritos?.find(
        d => d.productos.id === productoId
      );

      if (!detalleCarrito) {
        throw new NotFoundError('El producto no está en el carrito');
      }

      // Actualizar cantidad
      await this.carritoRepository.actualizarCantidad(detalleCarrito.id, nuevaCantidad);

      // Retornar carrito actualizado
      return await this.obtenerCarritoActivo(usuarioId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un producto específico del carrito
   * @param {number} usuarioId - ID del usuario
   * @param {number} productoId - ID del producto a eliminar
   * @returns {Promise<Object>}
   */
  async eliminarProducto(usuarioId, productoId) {
    try {
      // Obtener carrito del usuario
      const carritoConDetalles = await this.carritoRepository.getCarritoConDetalles(usuarioId);
      if (!carritoConDetalles) {
        throw new NotFoundError('No se encontró un carrito activo');
      }

      // Buscar el detalle del producto en el carrito
      const detalleCarrito = carritoConDetalles.detalles_carritos?.find(
        d => d.productos.id === productoId
      );

      if (!detalleCarrito) {
        throw new NotFoundError('El producto no está en el carrito');
      }

      // Eliminar el producto
      await this.carritoRepository.eliminarProducto(detalleCarrito.id);

      // Retornar carrito actualizado
      return await this.obtenerCarritoActivo(usuarioId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vacía completamente el carrito del usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Object>}
   */
  async vaciarCarrito(usuarioId) {
    try {
      // Obtener carrito activo
      const carrito = await this.carritoRepository.getOrCreateCarrito(usuarioId);

      // Vaciar todos los items
      await this.carritoRepository.vaciarCarrito(carrito.id);

      // Retornar carrito vacío
      return await this.obtenerCarritoActivo(usuarioId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cambia el estado del carrito
   * @param {number} usuarioId - ID del usuario
   * @param {number} nuevoEstado - 1: activo, 2: convertido a pedido, 3: abandonado
   * @returns {Promise<Object>}
   */
  async cambiarEstadoCarrito(usuarioId, nuevoEstado) {
    try {
      // Validar estado
      if (![1, 2, 3].includes(nuevoEstado)) {
        throw new ValidationError('Estado inválido. Debe ser 1 (activo), 2 (pedido) o 3 (abandonado)');
      }

      // Obtener carrito activo
      const carrito = await this.carritoRepository.getOrCreateCarrito(usuarioId);

      // Cambiar estado
      await this.carritoRepository.cambiarEstado(carrito.id, nuevoEstado);

      return {
        mensaje: 'Estado del carrito actualizado exitosamente',
        carrito_id: carrito.id,
        nuevo_estado: nuevoEstado
      };
    } catch (error) {
      throw error;
    }
  }
}

// Exportar instancia singleton
export default new CarritoService();
