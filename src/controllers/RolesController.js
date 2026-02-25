/**
 * CAPA DE CONTROLLERS (Presentation Layer / HTTP Handlers)
 *
 * Manejo de endpoints de roles
 */

import rolesService from '../services/RolesService.js';
import { ValidationError } from '../utils/errors.js';

export class RolesController {
  constructor(service = rolesService) {
    this.service = service;

    this.listarRoles = this.listarRoles.bind(this);
    this.getRolById = this.getRolById.bind(this);
    this.getRolesWithUsers = this.getRolesWithUsers.bind(this);
    this.getRolWithUsers = this.getRolWithUsers.bind(this);
    this.createRol = this.createRol.bind(this);
    this.updateRol = this.updateRol.bind(this);
    this.deleteRol = this.deleteRol.bind(this);
  }

  /**
   * GET /api/roles
   * Listar todos los roles
   */
  async listarRoles(req, res, next) {
    try {
      const roles = await this.service.getAllRoles();
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
   * GET /api/roles/:idRol
   * Obtener rol por ID
   */
  async getRolById(req, res, next) {
    try {
      const { idRol } = req.params;
      const rol = await this.service.getRolById(idRol);

      res.status(200).json({
        success: true,
        data: rol
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/roles/with-users
   * Listar roles con usuarios asociados
   */
  async getRolesWithUsers(req, res, next) {
    try {
      const roles = await this.service.getAllRolesWithUsers();

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
   * GET /api/roles/:idRol/with-users
   * Obtener rol por ID con usuarios asociados
   */
  async getRolWithUsers(req, res, next) {
    try {
      const { idRol } = req.params;
      const rol = await this.service.getRolByIdWithUsers(idRol);

      res.status(200).json({
        success: true,
        data: rol
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/roles
   * Crear nuevo rol
   */
  async createRol(req, res, next) {
    try {
      if (!req.body?.nombre) {
        throw new ValidationError('El campo "nombre" es requerido');
      }

      const rol = await this.service.createRol({
        nombre: req.body.nombre,
        descripcion: req.body.descripcion || null
      });

      res.status(201).json({
        success: true,
        message: 'Rol creado exitosamente',
        data: rol
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/roles/:idRol
   * Actualizar rol
   */
  async updateRol(req, res, next) {
    try {
      const { idRol } = req.params;
      const { id, creado_en, ...updateData } = req.body || {};

      if (!updateData || Object.keys(updateData).length === 0) {
        throw new ValidationError('No hay datos para actualizar');
      }

      const rol = await this.service.updateRol(idRol, updateData);

      res.status(200).json({
        success: true,
        message: 'Rol actualizado exitosamente',
        data: rol
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/roles/:idRol
   * Eliminar rol
   */
  async deleteRol(req, res, next) {
    try {
      const { idRol } = req.params;
      const result = await this.service.deleteRol(idRol);

      res.status(200).json({
        success: true,
        message: 'Rol eliminado exitosamente',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RolesController();
