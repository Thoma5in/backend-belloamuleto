/**
 * CAPA DE CONTROLLERS (Presentation Layer / HTTP Handlers)
 *
 * Registro de usuarios.
 */

import usuarioService from '../services/UsuarioService.js';
import { ValidationError } from '../utils/errors.js';

export class UsuarioController {
  constructor(service = usuarioService) {
    this.service = service;

    this.register = this.register.bind(this);
  }

  /**
   * POST /api/auth/register
   * Registra un usuario en Supabase Auth y crea su perfil.
   */
  async register(req, res, next) {
    try {
      const { email, password, nombre, direccion, telefono } = req.body || {};

      if (!email || !password || !nombre) {
        throw new ValidationError('email, password y nombre son requeridos');
      }

      const profile = await this.service.register({
        email,
        password,
        nombre,
        direccion,
        telefono
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UsuarioController();
