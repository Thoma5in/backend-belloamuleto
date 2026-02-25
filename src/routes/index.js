/**
 * INDEX DE ROUTES
 * 
 * Centraliza todas las rutas de la aplicación
 * Facilita el registro de nuevos recursos
 */

import { Router } from 'express';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import carritoRoutes from './carritoRoutes.js';
import authRoutes from './authRoutes.js';
import rolesRoutes from './rolesRoutes.js';
import empleadosRoutes from './empleadosRoutes.js';
import empleadosRolesRoutes from './empleadosRolesRoutes.js';

const router = Router();

// Rutas de productos
router.use('/products', productRoutes);

// Rutas de categorías
router.use('/categories', categoryRoutes);

// Rutas de carrito de compras
router.use('/carrito', carritoRoutes);

// Rutas de autenticacion
router.use('/auth', authRoutes);

// Rutas de roles
router.use('/roles', rolesRoutes);

// Rutas de empleados
router.use('/empleados', empleadosRoutes);

// Rutas de asignación empleados-roles (sin prefijo por estructura anidada)
router.use('/', empleadosRolesRoutes);

// Aquí puedes agregar más recursos:
// router.use('/users', userRoutes);
// router.use('/orders', orderRoutes);

// Ruta de health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
