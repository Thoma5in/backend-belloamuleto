/**
 * CAPA DE SERVICES (Business Logic Layer)
 *
 * Registro de usuarios con Supabase Auth + tabla usuarios.
 */

import supabase from '../config/supabase.js';
import usuarioRepository from '../repositories/UsuarioRepository.js';
import { DatabaseError, ValidationError } from '../utils/errors.js';

export class UsuarioService {
  constructor(repository = usuarioRepository, supabaseClient = supabase) {
    this.repository = repository;
    this.supabase = supabaseClient;
  }

  /**
   * Registra un usuario en Supabase Auth y crea su perfil en la tabla usuarios.
   * @param {Object} data
   * @param {string} data.email
   * @param {string} data.password
   * @param {string} data.nombre
   * @param {string} [data.direccion]
   * @param {string} [data.telefono]
   */
  async register(data) {
    this.validateRegisterData(data);

    const normalized = {
      email: data.email.trim().toLowerCase(),
      password: data.password,
      nombre: data.nombre.trim(),
      direccion: data.direccion?.trim() || null,
      telefono: data.telefono?.trim() || null
    };

    const existing = await this.repository.findByEmail(normalized.email);
    if (existing) {
      throw new ValidationError('Ya existe un usuario con ese email');
    }

    let authUserId = null;

    try {
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: normalized.email,
        password: normalized.password,
        options: {
          data: {
            nombre: normalized.nombre
          }
        }
      });

      if (error) {
        throw new ValidationError(error.message);
      }

      authUserId = authData?.user?.id;
      if (!authUserId) {
        throw new DatabaseError('No se pudo crear el usuario en Supabase Auth');
      }

      const profile = await this.repository.createFromAuth({
        auth_user_id: authUserId,
        nombre: normalized.nombre,
        email: normalized.email,
        direccion: normalized.direccion,
        telefono: normalized.telefono
      });

      return profile;
    } catch (error) {
      if (authUserId) {
        try {
          await this.supabase.auth.admin.deleteUser(authUserId);
        } catch (cleanupError) {
          console.warn('No se pudo limpiar el usuario en Auth:', cleanupError?.message || cleanupError);
        }
      }

      throw error;
    }
  }

  // ===== Validaciones =====

  validateRegisterData(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
      errors.push('Datos de registro invalidos');
    } else {
      if (!data.email || data.email.trim().length === 0) {
        errors.push('El email es requerido');
      }
      if (!data.password || data.password.length < 6) {
        errors.push('El password debe tener al menos 6 caracteres');
      }
      if (!data.nombre || data.nombre.trim().length === 0) {
        errors.push('El nombre es requerido');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(`Errores de validacion: ${errors.join(', ')}`);
    }
  }
}

export default new UsuarioService();
