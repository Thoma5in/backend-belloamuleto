/**
 * INDEX DE ROUTES
 * 
 * Centraliza todas las rutas de la aplicación
 * Facilita el registro de nuevos recursos
 */

import { Router } from 'express';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';

const router = Router();

// Rutas de productos
router.use('/products', productRoutes);

// Rutas de categorías
router.use('/categories', categoryRoutes);

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
