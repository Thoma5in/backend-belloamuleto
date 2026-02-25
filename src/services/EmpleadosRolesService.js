/**
 * CAPA DE SERVICES (Business Logic Layer)
 *
 * Gestión de la relación Empleados-Roles
 */

import empleadosRolesRepository from '../repositories/EmpleadosRolesRepository.js';
import rolesRepository from '../repositories/RolesRepository.js';
import empleadosService from './EmpleadosService.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class EmpleadosRolesService {
  constructor(
    repository = empleadosRolesRepository,
    rolesRepo = rolesRepository,
    empleadosServ = empleadosService
  ) {
    this.repository = repository;
    this.rolesRepository = rolesRepo;
    this.empleadosService = empleadosServ;
  }

  /**
   * Asigna un rol a un empleado
   * @param {Object} data
   */
  async asignarRol(data) {
    this.validateAsignacionData(data);

    const rol = await this.rolesRepository.getRolById(data.rol_id);
    if (!rol) {
      throw new NotFoundError(`Rol no encontrado`);
    }

    await this.empleadosService.getEmpleadoByUsuarioId(data.empleado_id);

    const tieneRol = await this.repository.empleadoTieneRol(data.empleado_id, data.rol_id);
    if (tieneRol) {
      throw new ValidationError('El empleado ya tiene este rol asignado');
    }

    const asignacion = await this.repository.asignarRol({
      empleado_id: data.empleado_id,
      rol_id: data.rol_id,
      otorgado_por: data.otorgado_por || null
    });

    return asignacion;
  }

  /**
   * Asigna múltiples roles
   * @param {string} empleadoId
   * @param {Array<string>} rolesIds
   * @param {string} [otorgadoPor]
   */
  async asignarMultiplesRoles(empleadoId, rolesIds, otorgadoPor = null) {
    this.validateId(empleadoId);

    if (!Array.isArray(rolesIds) || rolesIds.length === 0) {
      throw new ValidationError('Se debe proporcionar al menos un rol');
    }

    rolesIds.forEach((rolId, index) => {
      this.validateId(rolId);
    });

    const rolesExistentes = await Promise.all(
      rolesIds.map(rolId => this.rolesRepository.getRolById(rolId))
    );

    const rolesNoEncontrados = rolesIds.filter((rolId, index) => !rolesExistentes[index]);
    if (rolesNoEncontrados.length > 0) {
      throw new NotFoundError(`Roles no encontrados`);
    }

    await this.empleadosService.getEmpleadoByUsuarioId(empleadoId);

    const rolesActuales = await this.repository.getRolesByEmpleado(empleadoId);
    const rolesActualesIds = rolesActuales.map(r => r.rol_id);
    const rolesNuevos = rolesIds.filter(rolId => !rolesActualesIds.includes(rolId));

    if (rolesNuevos.length === 0) {
      throw new ValidationError('El empleado ya tiene todos estos roles');
    }

    const asignaciones = await this.repository.asignarMultiplesRoles(
      empleadoId,
      rolesNuevos,
      otorgadoPor
    );

    return asignaciones;
  }

  /**
   * Revoca un rol
   * @param {string} empleadoId
   * @param {string} rolId
   */
  async revocarRol(empleadoId, rolId) {
    this.validateId(empleadoId);
    this.validateId(rolId);

    const tieneRol = await this.repository.empleadoTieneRol(empleadoId, rolId);
    if (!tieneRol) {
      throw new NotFoundError('El empleado no tiene asignado este rol');
    }

    const result = await this.repository.revocarRol(empleadoId, rolId);
    
    if (!result) {
      throw new Error('Error al revocar el rol');
    }

    return result;
  }

  /**
   * Revoca todos los roles
   * @param {string} empleadoId
   */
  async revocarTodosLosRoles(empleadoId) {
    this.validateId(empleadoId);

    const rolesActuales = await this.repository.getRolesByEmpleado(empleadoId);
    if (rolesActuales.length === 0) {
      throw new ValidationError('El empleado no tiene roles asignados');
    }

    const result = await this.repository.revocarTodosLosRoles(empleadoId);
    return result;
  }

  /**
   * Obtiene roles de un empleado
   * @param {string} empleadoId
   */
  async getRolesByEmpleado(empleadoId) {
    this.validateId(empleadoId);
    return await this.repository.getRolesByEmpleado(empleadoId);
  }

  /**
   * Obtiene empleados con un rol
   * @param {string} rolId
   */
  async getEmpleadosByRol(rolId) {
    this.validateId(rolId);

    const rol = await this.rolesRepository.getRolById(rolId);
    if (!rol) {
      throw new NotFoundError(`Rol no encontrado`);
    }

    return await this.repository.getEmpleadosByRol(rolId);
  }

  /**
   * Verifica si empleado tiene rol
   * @param {string} empleadoId
   * @param {string} rolId
   */
  async empleadoTieneRol(empleadoId, rolId) {
    this.validateId(empleadoId);
    this.validateId(rolId);
    return await this.repository.empleadoTieneRol(empleadoId, rolId);
  }

  /**
   * Obtiene todas las asignaciones
   * @param {Object} options
   */
  async getAllAsignaciones(options = {}) {
    return await this.repository.getAllAsignaciones(options);
  }

  validateAsignacionData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Los datos deben ser un objeto');
    }

    this.validateId(data.empleado_id);
    this.validateId(data.rol_id);

    if (data.otorgado_por !== undefined && data.otorgado_por !== null) {
      this.validateId(data.otorgado_por);
    }
  }

  validateId(id) {
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw new ValidationError('El ID debe ser válido');
    }
  }
}

export default new EmpleadosRolesService();
