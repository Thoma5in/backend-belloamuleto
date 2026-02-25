/**
 * CAPA DE SERVICES (Business Logic Layer)
 *
 * Roles
 * - PK: id (uuid)
 * - nombre: text NOT NULL UNIQUE
 * - descripcion: text (nullable)
 * - creado_en: timestamp with time zone DEFAULT now()
 */

import rolesRepository from '../repositories/RolesRepository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class RolesService {
  constructor(repository = rolesRepository) {
    this.repository = repository;
  }

  /**
   * Obtiene todos los roles ordenados
   * @returns {Promise<Array>}
   */
  async getAllRoles() {
    return await this.repository.getAllRoles();
  }

  /**
   * Obtiene un rol por ID
   * @param {string} idRol - ID del rol (UUID)
   * @returns {Promise<Object>}
   */
  async getRolById(idRol) {
    this.validateId(idRol);

    const rol = await this.repository.getRolById(idRol);
    if (!rol) {
      throw new NotFoundError(`Rol con ID ${idRol} no encontrado`);
    }

    return rol;
  }

  /**
   * Obtiene un rol por ID con usuarios asociados
   * @param {string} idRol - ID del rol (UUID)
   * @returns {Promise<Object>}
   */
  async getRolByIdWithUsers(idRol) {
    this.validateId(idRol);

    const rol = await this.repository.getRolWithUsers(idRol);
    if (!rol) {
      throw new NotFoundError(`Rol con ID ${idRol} no encontrado`);
    }

    return rol;
  }

  /**
   * Obtiene todos los roles con usuarios asociados
   * @returns {Promise<Array>}
   */
  async getAllRolesWithUsers() {
    return await this.repository.getAllRolesWithUsers();
  }

  /**
   * Crea un nuevo rol
   * @param {Object} data
   * @param {string} data.nombre
   * @param {string} [data.descripcion]
   */
  async createRol(data) {
    this.validateRolData(data);

    const normalized = {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null
    };

    const existing = await this.repository.findByNombre(normalized.nombre);
    if (existing) {
      throw new ValidationError(`Ya existe un rol con el nombre "${normalized.nombre}"`);
    }

    return await this.repository.createRol(normalized);
  }

  /**
   * Actualiza un rol
   * @param {string} idRol - ID del rol (UUID)
   * @param {Object} updateData
   */
  async updateRol(idRol, updateData) {
    this.validateId(idRol);

    const existing = await this.repository.getRolById(idRol);
    if (!existing) {
      throw new NotFoundError(`Rol con ID ${idRol} no encontrado`);
    }

    const normalized = { ...updateData };

    if (normalized.nombre !== undefined) {
      normalized.nombre = normalized.nombre.trim();

      const existingByName = await this.repository.findByNombre(normalized.nombre);
      if (existingByName && existingByName.id !== idRol) {
        throw new ValidationError(`Ya existe otro rol con el nombre "${normalized.nombre}"`);
      }
    }

    if (normalized.descripcion !== undefined) {
      normalized.descripcion = normalized.descripcion?.trim() || null;
    }

    // No permitir actualizar creado_en o id
    delete normalized.creado_en;
    delete normalized.id;

    return await this.repository.updateRol(idRol, normalized);
  }

  /**
   * Elimina un rol
   * @param {string} idRol - ID del rol (UUID)
   */
  async deleteRol(idRol) {
    this.validateId(idRol);

    const existing = await this.repository.getRolById(idRol);
    if (!existing) {
      throw new NotFoundError(`Rol con ID ${idRol} no encontrado`);
    }

    const result = await this.repository.deleteRol(idRol);

    return result;
  }

  /**
   * Valida los datos de un rol
   * @private
   */
  validateRolData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Los datos del rol deben ser un objeto');
    }

    if (!data.nombre || typeof data.nombre !== 'string' || !data.nombre.trim()) {
      throw new ValidationError('El campo "nombre" es requerido y debe ser un texto válido');
    }

    if (data.descripcion !== undefined && data.descripcion !== null) {
      if (typeof data.descripcion !== 'string') {
        throw new ValidationError('El campo "descripcion" debe ser un texto o nulo');
      }
    }
  }

  /**
   * Valida un ID
   * @private
   */
  validateId(id) {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('El ID debe ser una cadena de texto válida');
    }
  }
}

export default new RolesService();
