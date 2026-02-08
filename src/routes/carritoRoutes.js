/**
 * CARRITO ROUTES
 * 
 * Capa de routing para el recurso Carrito de Compras.
 * 
 * Responsabilidades:
 * - Definir endpoints HTTP del carrito
 * - Asociar rutas con CarritoController
 * - (Futuro) Aplicar middlewares de autenticación/autorización
 */

import { Router } from 'express';
import carritoController from '../controllers/CarritoController.js';

const router = Router();

/**
 * @route   GET /api/carrito
 * @desc    Obtener el carrito activo del usuario
 * @access  Temporalmente Public (usuario_id se envía en la petición para pruebas)
 * @body    {number} usuario_id - ID del usuario (también puede ir como query ?usuario_id=)
 */
router.get('/', carritoController.obtenerCarrito);

/**
 * @route   POST /api/carrito/items
 * @desc    Agregar un producto al carrito
 * @access  Temporalmente Public (usuario_id se envía en la petición para pruebas)
 * @body    {number} usuario_id - ID del usuario (requerido)
 * @body    {number} producto_id - ID del producto (requerido)
 * @body    {number} cantidad - Cantidad a agregar (opcional, default: 1)
 */
router.post('/items', carritoController.agregarProducto);

/**
 * @route   PUT /api/carrito/items/:productoId
 * @desc    Actualizar la cantidad de un producto en el carrito
 * @access  Temporalmente Public (usuario_id se envía en la petición para pruebas)
 * @param   {number} productoId - ID del producto
 * @body    {number} usuario_id - ID del usuario (requerido)
 * @body    {number} cantidad - Nueva cantidad (requerida)
 */
router.put('/items/:productoId', carritoController.actualizarCantidad);

/**
 * @route   DELETE /api/carrito/items/:productoId
 * @desc    Eliminar un producto específico del carrito
 * @access  Temporalmente Public (usuario_id se envía en la petición para pruebas)
 * @param   {number} productoId - ID del producto
 * @body    {number} usuario_id - ID del usuario (requerido)
 */
router.delete('/items/:productoId', carritoController.eliminarProducto);

/**
 * @route   DELETE /api/carrito
 * @desc    Vaciar completamente el carrito del usuario
 * @access  Temporalmente Public (usuario_id se envía en la petición para pruebas)
 * @body    {number} usuario_id - ID del usuario (requerido)
 */
router.delete('/', carritoController.vaciarCarrito);

export default router;
