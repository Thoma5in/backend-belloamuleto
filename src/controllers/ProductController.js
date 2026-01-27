/**
 * CAPA DE CONTROLLERS (Presentation Layer / HTTP Handlers)
 * 
 * Responsabilidades:
 * - Manejo de HTTP: request/response
 * - Validación básica de entrada (formato, tipos)
 * - Extracción de parámetros de la petición
 * - Llamar al service correspondiente
 * - Formatear respuestas HTTP
 * - NO contiene lógica de negocio
 * 
 * DECISIÓN ARQUITECTÓNICA:
 * Los controllers son "tontos" - solo se encargan de HTTP.
 * Toda la lógica de negocio está en Services.
 * Esto permite:
 * 1. Reutilizar services en diferentes interfaces (REST, GraphQL, CLI, etc.)
 * 2. Testing más fácil de la lógica de negocio
 * 3. Separación clara de responsabilidades
 */

import productService from '../services/ProductService.js';
import { ValidationError } from '../utils/errors.js';

export class ProductController {
  constructor(service = productService) {
    this.service = service;
    
    // Bind methods para mantener el contexto de 'this'
    this.getAllProducts = this.getAllProducts.bind(this);
    this.getProductById = this.getProductById.bind(this);
    this.createProduct = this.createProduct.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
    this.searchProducts = this.searchProducts.bind(this);
    this.getProductsByCategory = this.getProductsByCategory.bind(this);
    this.updateProductStock = this.updateProductStock.bind(this);
    this.getLowStockProducts = this.getLowStockProducts.bind(this);
  }

  /**
   * GET /api/products
   * Obtiene todos los productos con paginación y filtros
   */
  async getAllProducts(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        idCategoria: req.query.idCategoria ? parseInt(req.query.idCategoria) : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
        sortBy: req.query.sortBy || 'id',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await this.service.getAllProducts(filters);

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: {
          currentPage: result.page,
          totalPages: result.totalPages,
          totalItems: result.total,
          itemsPerPage: result.limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id
   * Obtiene un producto por ID
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;

      const product = await this.service.getProductById(id);

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products
   * Crea un nuevo producto
   */
  async createProduct(req, res, next) {
    try {
      // Validación básica de entrada
      const requiredFields = ['nombre', 'precio'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        throw new ValidationError(
          `Campos requeridos faltantes: ${missingFields.join(', ')}`
        );
      }

      const productData = {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        precio: req.body.precio,
        stock: req.body.stock,
        id_categoria: req.body.id_categoria ? parseInt(req.body.id_categoria) : undefined
      };

      const product = await this.service.createProduct(productData);

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/products/:id
   * Actualiza un producto existente
   */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      
      // No permitir actualizar campos del sistema
      const { created_at, id: bodyId, ...updateData } = req.body;

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('No hay datos para actualizar');
      }

      const product = await this.service.updateProduct(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id
   * Elimina un producto (soft delete)
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      const result = await this.service.deleteProduct(id);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/search?q=termo
   * Busca productos por nombre
   */
  async searchProducts(req, res, next) {
    try {
      const { q } = req.query;

      if (!q) {
        throw new ValidationError('El parámetro de búsqueda "q" es requerido');
      }

      const products = await this.service.searchProducts(q);

      res.status(200).json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/category/:category
   * Obtiene productos por categoría
   */
  async getProductsByCategory(req, res, next) {
    try {
      const { idCategoria } = req.params;

      const products = await this.service.getProductsByCategory(parseInt(idCategoria));

      res.status(200).json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/products/:id/stock
   * Actualiza el stock de un producto
   * Body: { quantity: number }
   */
  async updateProductStock(req, res, next) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (quantity === undefined || quantity === null) {
        throw new ValidationError('La cantidad es requerida');
      }

      if (typeof quantity !== 'number') {
        throw new ValidationError('La cantidad debe ser un número');
      }

      const product = await this.service.updateProductStock(id, quantity);

      res.status(200).json({
        success: true,
        message: 'Stock actualizado exitosamente',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/low-stock
   * Obtiene productos con stock bajo
   */
  async getLowStockProducts(req, res, next) {
    try {
      const products = await this.service.getLowStockProducts();

      res.status(200).json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      next(error);
    }
  }
}

// Exportar instancia singleton
export default new ProductController();
