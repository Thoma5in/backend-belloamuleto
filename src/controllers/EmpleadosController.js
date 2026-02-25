/**
 * CAPA DE CONTROLLERS (Presentation Layer / HTTP Handlers)
 *
 * Manejo de endpoints de empleados
 */

import empleadosService from '../services/EmpleadosService.js';
import { ValidationError } from '../utils/errors.js';

export class EmpleadosController {
  constructor(service = empleadosService) {
    this.service = service;

    this.listarEmpleados = this.listarEmpleados.bind(this);
    this.listarEmpleadosConRoles = this.listarEmpleadosConRoles.bind(this);
    this.getEmpleadoById = this.getEmpleadoById.bind(this);
    this.getEmpleadoWithRoles = this.getEmpleadoWithRoles.bind(this);
    this.createEmpleado = this.createEmpleado.bind(this);
    this.updateEmpleado = this.updateEmpleado.bind(this);
    this.deleteEmpleado = this.deleteEmpleado.bind(this);
  }

  /**
   * GET /api/empleados
   * Listar todos los empleados
   */
  async listarEmpleados(req, res, next) {
    try {
      const { activos } = req.query;
      
      const options = {};
      if (activos !== undefined) {
        options.activos = activos === 'true';
      }

      const empleados = await this.service.getAllEmpleados(options);
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
   * GET /api/empleados/with-roles
   * Listar empleados con sus roles
   */
  async listarEmpleadosConRoles(req, res, next) {
    try {
      const { activos } = req.query;
      
      const options = {};
      if (activos !== undefined) {
        options.activos = activos === 'true';
      }

      const empleados = await this.service.getAllEmpleadosWithRoles(options);
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
   * GET /api/empleados/:usuarioId
   * Obtener empleado por usuario_id
   */
  async getEmpleadoById(req, res, next) {
    try {
      const { usuarioId } = req.params;
      const empleado = await this.service.getEmpleadoByUsuarioId(usuarioId);

      res.status(200).json({
        success: true,
        data: empleado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/empleados/:usuarioId/with-roles
   * Obtener empleado con roles
   */
  async getEmpleadoWithRoles(req, res, next) {
    try {
      const { usuarioId } = req.params;
      const empleado = await this.service.getEmpleadoWithRoles(usuarioId);

      res.status(200).json({
        success: true,
        data: empleado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/empleados
   * Crear nuevo empleado
   */
  async createEmpleado(req, res, next) {
    try {
      if (!req.body?.usuario_id) {
        throw new ValidationError('El campo usuario_id es requerido');
      }

      const empleado = await this.service.createEmpleado({
        usuario_id: req.body.usuario_id,
        numero_empleado: req.body.numero_empleado || null,
        fecha_contratacion: req.body.fecha_contratacion || null,
        departamento: req.body.departamento || null,
        activo: req.body.activo !== false
      });

      res.status(201).json({
        success: true,
        message: 'Empleado creado exitosamente',
        data: empleado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/empleados/:usuarioId
   * Actualizar empleado
   */
  async updateEmpleado(req, res, next) {
    try {
      const { usuarioId } = req.params;
      const { usuario_id, creado_en, ...updateData } = req.body || {};

      if (!updateData || Object.keys(updateData).length === 0) {
        throw new ValidationError('No hay datos para actualizar');
      }

      const empleado = await this.service.updateEmpleado(usuarioId, updateData);

      res.status(200).json({
        success: true,
        message: 'Empleado actualizado exitosamente',
        data: empleado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/empleados/:usuarioId
   * Eliminar empleado
   */
  async deleteEmpleado(req, res, next) {
    try {
      const { usuarioId } = req.params;
      const result = await this.service.deleteEmpleado(usuarioId);

      res.status(200).json({
        success: true,
        message: 'Empleado eliminado exitosamente',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new EmpleadosController();
