/**
 * CAPA DE ROUTES (Routing Layer)
 *
 * Endpoints de asignación de roles a empleados
 */

import { Router } from 'express';
import empleadosRolesController from '../controllers/EmpleadosRolesController.js';

const router = Router();

/**
 * @route   GET /api/empleados-roles
 * @desc    Listar todas las asignaciones de roles
 * @access  Private (pendiente auth)
 */
router.get('/empleados-roles', empleadosRolesController.getAllAsignaciones);

/**
 * @route   GET /api/empleados/:empleadoId/roles
 * @desc    Obtener todos los roles de un empleado
 * @access  Public
 */
router.get('/empleados/:empleadoId/roles', empleadosRolesController.getRolesByEmpleado);

/**
 * @route   POST /api/empleados/:empleadoId/roles
 * @desc    Asignar rol(es) a un empleado
 * @access  Private (pendiente auth)
 */
router.post('/empleados/:empleadoId/roles', empleadosRolesController.asignarRol);

/**
 * @route   POST /api/empleados/:empleadoId/roles/bulk
 * @desc    Asignar múltiples roles a un empleado
 * @access  Private (pendiente auth)
 */
router.post('/empleados/:empleadoId/roles/bulk', empleadosRolesController.asignarMultiplesRoles);

/**
 * @route   DELETE /api/empleados/:empleadoId/roles/:rolId
 * @desc    Revocar un rol específico de un empleado
 * @access  Private (pendiente auth)
 */
router.delete('/empleados/:empleadoId/roles/:rolId', empleadosRolesController.revocarRol);

/**
 * @route   DELETE /api/empleados/:empleadoId/roles
 * @desc    Revocar todos los roles de un empleado
 * @access  Private (pendiente auth)
 */
router.delete('/empleados/:empleadoId/roles', empleadosRolesController.revocarTodosLosRoles);

/**
 * @route   GET /api/empleados/:empleadoId/roles/:rolId/verificar
 * @desc    Verificar si un empleado tiene un rol específico
 * @access  Public
 */
router.get('/empleados/:empleadoId/roles/:rolId/verificar', empleadosRolesController.verificarRol);

/**
 * @route   GET /api/roles/:rolId/empleados
 * @desc    Obtener todos los empleados con un rol específico
 * @access  Public
 */
router.get('/roles/:rolId/empleados', empleadosRolesController.getEmpleadosByRol);

export default router;
