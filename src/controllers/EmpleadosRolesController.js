/**
 * CAPA DE CONTROLLERS (Presentation Layer / HTTP Handlers)
 *
 * Manejo de endpoints de asignación de roles a empleados
 */

import empleadosRolesService from '../services/EmpleadosRolesService.js';
import { ValidationError } from '../utils/errors.js';

export class EmpleadosRolesController {
  constructor(service = empleadosRolesService) {
    this.service = service;

    this.asignarRol = this.asignarRol.bind(this);
    this.asignarMultiplesRoles = this.asignarMultiplesRoles.bind(this);
    this.revocarRol = this.revocarRol.bind(this);
    this.revocarTodosLosRoles = this.revocarTodosLosRoles.bind(this);
    this.getRolesByEmpleado = this.getRolesByEmpleado.bind(this);
    this.getEmpleadosByRol = this.getEmpleadosByRol.bind(this);
    this.verificarRol = this.verificarRol.bind(this);
    this.getAllAsignaciones = this.getAllAsignaciones.bind(this);
  }

  /**
   * POST /api/empleados/:empleadoId/roles
   * Asigna uno o más roles a un empleado
   */
  async asignarRol(req, res, next) {
    try {
      const { empleadoId } = req.params;
      const { rol_id, roles_ids, otorgado_por } = req.body || {};

      if (roles_ids && Array.isArray(roles_ids)) {
        const asignaciones = await this.service.asignarMultiplesRoles(
          empleadoId,
          roles_ids,
          otorgado_por || null
        );

        return res.status(201).json({
          success: true,
          message: `${asignaciones.length} rol(es) asignado(s) exitosamente`,
          data: asignaciones,
          count: asignaciones.length
        });
      }

      if (!rol_id) {
        throw new ValidationError('Se requiere rol_id o roles_ids');
      }

      const asignacion = await this.service.asignarRol({
        empleado_id: empleadoId,
        rol_id,
        otorgado_por: otorgado_por || null
      });

      res.status(201).json({
        success: true,
        message: 'Rol asignado exitosamente',
        data: asignacion
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/empleados/:empleadoId/roles/bulk
   * Asignar múltiples roles
   */
  async asignarMultiplesRoles(req, res, next) {
    try {
      const { empleadoId } = req.params;
      const { roles_ids, otorgado_por } = req.body || {};

      if (!roles_ids || !Array.isArray(roles_ids)) {
        throw new ValidationError('Se requiere un array de roles_ids');
      }

      const asignaciones = await this.service.asignarMultiplesRoles(
        empleadoId,
        roles_ids,
        otorgado_por || null
      );

      res.status(201).json({
        success: true,
        message: `${asignaciones.length} rol(es) asignado(s) exitosamente`,
        data: asignaciones,
        count: asignaciones.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/empleados/:empleadoId/roles/:rolId
   * Revocar un rol específico
   */
  async revocarRol(req, res, next) {
    try {
      const { empleadoId, rolId } = req.params;
      const result = await this.service.revocarRol(empleadoId, rolId);

      res.status(200).json({
        success: true,
        message: 'Rol revocado exitosamente',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/empleados/:empleadoId/roles
   * Revocar todos los roles
   */
  async revocarTodosLosRoles(req, res, next) {
    try {
      const { empleadoId } = req.params;
      const result = await this.service.revocarTodosLosRoles(empleadoId);

      res.status(200).json({
        success: true,
        message: 'Todos los roles han sido revocados',
        data: result,
        count: result.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/empleados/:empleadoId/roles
   * Obtener roles de un empleado
   */
  async getRolesByEmpleado(req, res, next) {
    try {
      const { empleadoId } = req.params;
      const roles = await this.service.getRolesByEmpleado(empleadoId);

      res.status(200).json({
        success: true,
        data: roles,
        count: roles.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/roles/:rolId/empleados
   * Obtener empleados con un rol
   */
  async getEmpleadosByRol(req, res, next) {
    try {
      const { rolId } = req.params;
      const empleados = await this.service.getEmpleadosByRol(rolId);

      res.status(200).json({
        success: true,
        data: empleados,
        count: empleados.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/empleados/:empleadoId/roles/:rolId/verificar
   * Verificar si empleado tiene rol
   */
  async verificarRol(req, res, next) {
    try {
      const { empleadoId, rolId } = req.params;
      const tieneRol = await this.service.empleadoTieneRol(empleadoId, rolId);

      res.status(200).json({
        success: true,
        data: {
          empleado_id: empleadoId,
          rol_id: rolId,
          tiene_rol: tieneRol
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/empleados-roles
   * Obtener todas las asignaciones
   */
  async getAllAsignaciones(req, res, next) {
    try {
      const { limit, offset } = req.query;

      const options = {};
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);

      const asignaciones = await this.service.getAllAsignaciones(options);

      res.status(200).json({
        success: true,
        data: asignaciones,
        count: asignaciones.length
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new EmpleadosRolesController();
