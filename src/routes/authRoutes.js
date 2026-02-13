/**
 * AUTH ROUTES
 *
 * Endpoints de autenticacion y registro.
 */

import { Router } from 'express';
import usuarioController from '../controllers/UsuarioController.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar usuario
 * @access  Public
 */
router.post('/register', usuarioController.register);

export default router;
