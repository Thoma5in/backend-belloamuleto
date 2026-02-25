/**
 * CAPA DE ROUTES (Routing Layer)
 *
 * Endpoints de roles
 */

import { Router } from 'express';
import rolesController from '../controllers/RolesController.js';

const router = Router();

/**
 * @route   GET /api/roles
 * @desc    Listar todos los roles
 * @access  Public
 */
router.get('/', rolesController.listarRoles);

/**
 * @route   GET /api/roles/with-users
 * @desc    Listar roles con usuarios asociados
 * @access  Public
 */
router.get('/with-users', rolesController.getRolesWithUsers);

/**
 * @route   GET /api/roles/:idRol
 * @desc    Obtener rol por ID
 * @access  Public
 */
router.get('/:idRol', rolesController.getRolById);

/**
 * @route   GET /api/roles/:idRol/with-users
 * @desc    Obtener rol por ID con usuarios asociados
 * @access  Public
 */
router.get('/:idRol/with-users', rolesController.getRolWithUsers);

/**
 * @route   POST /api/roles
 * @desc    Crear nuevo rol
 * @access  Private (pendiente auth)
 */
router.post('/', rolesController.createRol);

/**
 * @route   PUT /api/roles/:idRol
 * @desc    Actualizar rol
 * @access  Private (pendiente auth)
 */
router.put('/:idRol', rolesController.updateRol);

/**
 * @route   DELETE /api/roles/:idRol
 * @desc    Eliminar rol
 * @access  Private (pendiente auth)
 */
router.delete('/:idRol', rolesController.deleteRol);

export default router;
