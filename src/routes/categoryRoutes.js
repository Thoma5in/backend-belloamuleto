/**
 * CAPA DE ROUTES (Routing Layer)
 *
 * Endpoints de categorías de producto
 */

import { Router } from 'express';
import categoriaController from '../controllers/CategoriaController.js';

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Listar categorías
 * @access  Public
 */
router.get('/', categoriaController.listarCategorias);

/**
 * @route   GET /api/categories/with-count
 * @desc    Listar categorías con conteo de productos
 * @access  Public
 */
router.get('/with-count', categoriaController.getCategoriasWithProductCount);

/**
 * @route   GET /api/categories/:idCategoria
 * @desc    Obtener categoría por ID
 * @access  Public
 */
router.get('/:idCategoria', categoriaController.getCategoriaById);

/**
 * @route   POST /api/categories
 * @desc    Crear categoría
 * @access  Private (pendiente auth)
 */
router.post('/', categoriaController.createCategoria);

/**
 * @route   PUT /api/categories/:idCategoria
 * @desc    Actualizar categoría
 * @access  Private (pendiente auth)
 */
router.put('/:idCategoria', categoriaController.updateCategoria);

/**
 * @route   DELETE /api/categories/:idCategoria
 * @desc    Eliminar categoría
 * @access  Private (pendiente auth)
 */
router.delete('/:idCategoria', categoriaController.deleteCategoria);

export default router;
