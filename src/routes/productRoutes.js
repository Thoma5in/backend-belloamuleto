/**
 * CAPA DE ROUTES (Routing Layer)
 * 
 * Responsabilidades:
 * - Definir endpoints HTTP
 * - Asociar rutas con controllers
 * - Aplicar middlewares específicos de ruta (autenticación, validación, etc.)
 * - Documentar endpoints
 * 
 * DECISIÓN ARQUITECTÓNICA:
 * Las rutas son configuraciones declarativas que conectan
 * URLs con controladores. Mantienen el código organizado y
 * facilitan la documentación de la API.
 */

import { Router } from 'express';
import productController from '../controllers/ProductController.js';

const router = Router();

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos con paginación y filtros
 * @access  Public
 * @query   {number} page - Número de página (default: 1)
 * @query   {number} limit - Límite de items por página (default: 10)
 * @query   {string} category - Filtrar por categoría
 * @query   {number} minPrice - Precio mínimo
 * @query   {number} maxPrice - Precio máximo
 * @query   {boolean} isActive - Filtrar por productos activos
 * @query   {string} sortBy - Campo para ordenar (default: created_at)
 * @query   {string} sortOrder - Orden: asc o desc (default: desc)
 */
router.get('/', productController.getAllProducts);

/**
 * @route   GET /api/products/low-stock
 * @desc    Obtener productos con stock bajo
 * @access  Public
 * @note    Esta ruta debe ir ANTES de /:id para evitar conflictos
 */
router.get('/low-stock', productController.getLowStockProducts);

/**
 * @route   GET /api/products/search
 * @desc    Buscar productos por nombre
 * @access  Public
 * @query   {string} q - Término de búsqueda (requerido)
 */
router.get('/search', productController.searchProducts);

/**
 * @route   GET /api/products/category/:category
 * @desc    Obtener productos por categoría
 * @access  Public
 * @param   {string} category - Nombre de la categoría
 */
router.get('/category/:category', productController.getProductsByCategory);

/**
 * @route   GET /api/products/:id
 * @desc    Obtener un producto por ID
 * @access  Public
 * @param   {string} id - ID del producto (UUID)
 */
router.get('/:id', productController.getProductById);

/**
 * @route   POST /api/products
 * @desc    Crear un nuevo producto
 * @access  Private (aquí podrías agregar middleware de autenticación)
 * @body    {object} product - Datos del producto
 * @body    {string} product.name - Nombre del producto (requerido)
 * @body    {string} product.description - Descripción
 * @body    {number} product.price - Precio (requerido)
 * @body    {number} product.stock - Stock inicial
 * @body    {string} product.category - Categoría
 * @body    {boolean} product.is_active - Estado activo
 */
router.post('/', productController.createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Actualizar un producto completo
 * @access  Private
 * @param   {string} id - ID del producto
 * @body    {object} product - Datos a actualizar
 */
router.put('/:id', productController.updateProduct);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Actualizar solo el stock de un producto
 * @access  Private
 * @param   {string} id - ID del producto
 * @body    {number} quantity - Cantidad a agregar/restar
 */
router.patch('/:id/stock', productController.updateProductStock);

/**
 * @route   DELETE /api/products/:id
 * @desc    Eliminar un producto (soft delete)
 * @access  Private
 * @param   {string} id - ID del producto
 */
router.delete('/:id', productController.deleteProduct);

export default router;
