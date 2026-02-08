/**
 * CARRITO CONTROLLER
 * 
 * Capa de presentación para la gestión del carrito de compras.
 * 
 * Responsabilidades:
 * - Manejo de HTTP: request/response
 * - Validación básica de entrada
 * - Extracción de parámetros
 * - Llamar al CarritoService
 * - Formatear respuestas HTTP
 * - NO contiene lógica de negocio
 */

import carritoService from '../services/CarritoService.js';
import { ValidationError } from '../utils/errors.js';

export class CarritoController {
  constructor(service = carritoService) {
    this.service = service;
    
    // Bind methods para mantener el contexto de 'this'
    this.obtenerCarrito = this.obtenerCarrito.bind(this);
    this.agregarProducto = this.agregarProducto.bind(this);
    this.actualizarCantidad = this.actualizarCantidad.bind(this);
    this.eliminarProducto = this.eliminarProducto.bind(this);
    this.vaciarCarrito = this.vaciarCarrito.bind(this);
  }

  /**
   * GET /api/carrito
   * Obtiene el carrito activo del usuario
   * Body / Query: { usuario_id: number }
   */
  async obtenerCarrito(req, res, next) {
    try {
      // Para simplificar pruebas, el usuario se envía en la petición
      const rawUsuarioId = req.body?.usuario_id ?? req.query?.usuario_id;

      if (!rawUsuarioId) {
        throw new ValidationError('El usuario_id es requerido');
      }

      const usuarioId = parseInt(rawUsuarioId);
      if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        throw new ValidationError('El usuario_id debe ser un número entero positivo');
      }

      const carrito = await this.service.obtenerCarritoActivo(usuarioId);

      res.status(200).json({
        success: true,
        data: carrito
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/carrito/items
   * Agrega un producto al carrito
   * Body: { usuario_id: number, producto_id: number, cantidad: number }
   */
  async agregarProducto(req, res, next) {
    try {
      const { usuario_id, producto_id, cantidad } = req.body;

      if (!usuario_id) {
        throw new ValidationError('El usuario_id es requerido');
      }

      const usuarioId = parseInt(usuario_id);
      if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        throw new ValidationError('El usuario_id debe ser un número entero positivo');
      }

      // Validaciones básicas de entrada
      if (!producto_id) {
        throw new ValidationError('El producto_id es requerido');
      }

      const productoId = parseInt(producto_id);
      if (!Number.isInteger(productoId) || productoId <= 0) {
        throw new ValidationError('El producto_id debe ser un número entero positivo');
      }

      const cant = cantidad ? parseInt(cantidad) : 1;
      if (!Number.isInteger(cant) || cant <= 0) {
        throw new ValidationError('La cantidad debe ser un número entero mayor a 0');
      }

      const carrito = await this.service.agregarProducto(usuarioId, productoId, cant);

      res.status(200).json({
        success: true,
        message: 'Producto agregado al carrito exitosamente',
        data: carrito
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/carrito/items/:productoId
   * Actualiza la cantidad de un producto en el carrito
   * Body: { usuario_id: number, cantidad: number }
   */
  async actualizarCantidad(req, res, next) {
    try {
      const { productoId } = req.params;
      const { usuario_id, cantidad } = req.body;

      if (!usuario_id) {
        throw new ValidationError('El usuario_id es requerido');
      }

      const usuarioId = parseInt(usuario_id);
      if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        throw new ValidationError('El usuario_id debe ser un número entero positivo');
      }

      // Validaciones básicas
      const prodId = parseInt(productoId);
      if (!Number.isInteger(prodId) || prodId <= 0) {
        throw new ValidationError('El productoId debe ser un número entero positivo');
      }

      if (!cantidad) {
        throw new ValidationError('La cantidad es requerida');
      }

      const cant = parseInt(cantidad);
      if (!Number.isInteger(cant) || cant <= 0) {
        throw new ValidationError('La cantidad debe ser un número entero mayor a 0');
      }

      const carrito = await this.service.actualizarCantidadProducto(usuarioId, prodId, cant);

      res.status(200).json({
        success: true,
        message: 'Cantidad actualizada exitosamente',
        data: carrito
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/carrito/items/:productoId
   * Elimina un producto del carrito
   */
  async eliminarProducto(req, res, next) {
    try {
      const { productoId } = req.params;
      const { usuario_id } = req.body;

      if (!usuario_id) {
        throw new ValidationError('El usuario_id es requerido');
      }

      const usuarioId = parseInt(usuario_id);
      if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        throw new ValidationError('El usuario_id debe ser un número entero positivo');
      }

      const prodId = parseInt(productoId);
      if (!Number.isInteger(prodId) || prodId <= 0) {
        throw new ValidationError('El productoId debe ser un número entero positivo');
      }

      const carrito = await this.service.eliminarProducto(usuarioId, prodId);

      res.status(200).json({
        success: true,
        message: 'Producto eliminado del carrito exitosamente',
        data: carrito
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/carrito
   * Vacía completamente el carrito
   */
  async vaciarCarrito(req, res, next) {
    try {
      const { usuario_id } = req.body;

      if (!usuario_id) {
        throw new ValidationError('El usuario_id es requerido');
      }

      const usuarioId = parseInt(usuario_id);
      if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        throw new ValidationError('El usuario_id debe ser un número entero positivo');
      }

      const carrito = await this.service.vaciarCarrito(usuarioId);

      res.status(200).json({
        success: true,
        message: 'Carrito vaciado exitosamente',
        data: carrito
      });
    } catch (error) {
      next(error);
    }
  }
}

// Exportar instancia singleton
export default new CarritoController();
