/**
 * CAPA DE ROUTES (Routing Layer)
 *
 * Endpoints de empleados
 */

import { Router } from 'express';
import empleadosController from '../controllers/EmpleadosController.js';

const router = Router();

/**
 * @route   GET /api/empleados
 * @desc    Listar todos los empleados
 * @access  Public
 */
router.get('/', empleadosController.listarEmpleados);

/**
 * @route   GET /api/empleados/with-roles
 * @desc    Listar empleados con sus roles
 * @access  Public
 */
router.get('/with-roles', empleadosController.listarEmpleadosConRoles);

/**
 * @route   GET /api/empleados/:usuarioId
 * @desc    Obtener empleado por usuario_id
 * @access  Public
 */
router.get('/:usuarioId', empleadosController.getEmpleadoById);

/**
 * @route   GET /api/empleados/:usuarioId/with-roles
 * @desc    Obtener empleado con sus roles
 * @access  Public
 */
router.get('/:usuarioId/with-roles', empleadosController.getEmpleadoWithRoles);

/**
 * @route   POST /api/empleados
 * @desc    Crear nuevo empleado
 * @access  Private (pendiente auth)
 */
router.post('/', empleadosController.createEmpleado);

/**
 * @route   PUT /api/empleados/:usuarioId
 * @desc    Actualizar empleado
 * @access  Private (pendiente auth)
 */
router.put('/:usuarioId', empleadosController.updateEmpleado);

/**
 * @route   DELETE /api/empleados/:usuarioId
 * @desc    Eliminar empleado
 * @access  Private (pendiente auth)
 */
router.delete('/:usuarioId', empleadosController.deleteEmpleado);

export default router;
