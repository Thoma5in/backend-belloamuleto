/**
 * CAPA DE SERVICES (Business Logic Layer)
 * 
 * Responsabilidades:
 * - Contiene TODA la lógica de negocio
 * - Orquesta operaciones entre múltiples repositories
 * - Valida reglas de negocio
 * - Transforma datos para la presentación
 * - NO conoce HTTP ni detalles de base de datos
 * 
 * ADAPTADO AL ESQUEMA REAL DE BELLO AMULETO:
 * - Tabla: productos (nombre, descripcion, precio, stock, id_categoria)
 * - IDs son bigint autoincrementales, no UUIDs
 * - No hay columnas de auditoría (created_at, updated_at, deleted_at)
 * - No hay campo is_active
 */

import productRepository from '../repositories/ProductRepository.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export class ProductService {
  constructor(repository = productRepository) {
    this.repository = repository;
  }

  /**
   * Obtiene todos los productos con filtros y paginación
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>}
   */
  async getAllProducts(filters = {}) {
    try {
      const result = await this.repository.findWithPagination(filters);
      
      // Lógica de negocio: agregar información calculada
      result.products = result.products.map(product => ({
        ...product,
        isLowStock: product.stock < 10,
        isOutOfStock: product.stock === 0,
        formattedPrice: `$${parseFloat(product.precio).toFixed(2)}`,
        stockStatus: this.getStockStatus(product.stock)
      }));

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un producto por ID
   * @param {number} id - ID del producto (bigint)
   * @returns {Promise<Object>}
   */
  async getProductById(id) {
    try {
      this.validateId(id);

      const product = await this.repository.findById(id);
      
      if (!product) {
        throw new NotFoundError(`Producto con ID ${id} no encontrado`);
      }

      // Lógica de negocio: enriquecer datos
      return {
        ...product,
        isLowStock: product.stock < 10,
        isOutOfStock: product.stock === 0,
        formattedPrice: `$${parseFloat(product.precio).toFixed(2)}`,
        stockStatus: this.getStockStatus(product.stock)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea un nuevo producto
   * @param {Object} productData - Datos del producto { nombre, descripcion, precio, stock, id_categoria }
   * @returns {Promise<Object>}
   */
  async createProduct(productData) {
    try {
      // Validaciones de negocio
      this.validateProductData(productData);

      // Regla de negocio: normalizar datos
      const normalizedData = {
        nombre: productData.nombre.trim(),
        descripcion: productData.descripcion?.trim() || null,
        precio: parseFloat(productData.precio),
        stock: parseInt(productData.stock) || 0,
        id_categoria: productData.id_categoria ? parseInt(productData.id_categoria) : null
      };

      // Regla de negocio: validar precio mínimo
      if (normalizedData.precio < 0) {
        throw new ValidationError('El precio no puede ser negativo');
      }

      // Regla de negocio: validar stock
      if (normalizedData.stock < 0) {
        throw new ValidationError('El stock no puede ser negativo');
      }

      // Regla de negocio: verificar que no existe producto con el mismo nombre
      const existingProduct = await this.repository.findOne({ nombre: normalizedData.nombre });
      if (existingProduct) {
        throw new ValidationError(`Ya existe un producto con el nombre "${normalizedData.nombre}"`);
      }

      const product = await this.repository.create(normalizedData);
      
      return {
        ...product,
        formattedPrice: `$${parseFloat(product.precio).toFixed(2)}`
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un producto existente
   * @param {number} id - ID del producto
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async updateProduct(id, updateData) {
    try {
      this.validateId(id);

      // Verificar que el producto existe
      const existingProduct = await this.repository.findById(id);
      if (!existingProduct) {
        throw new NotFoundError(`Producto con ID ${id} no encontrado`);
      }

      // Validaciones de negocio
      if (updateData.precio !== undefined && updateData.precio < 0) {
        throw new ValidationError('El precio no puede ser negativo');
      }

      if (updateData.stock !== undefined && updateData.stock < 0) {
        throw new ValidationError('El stock no puede ser negativo');
      }

      // Regla de negocio: si se actualiza el nombre, verificar que no exista otro con ese nombre
      if (updateData.nombre && updateData.nombre !== existingProduct.nombre) {
        const productWithSameName = await this.repository.findOne({ nombre: updateData.nombre });
        if (productWithSameName && productWithSameName.id !== id) {
          throw new ValidationError(`Ya existe un producto con el nombre "${updateData.nombre}"`);
        }
      }

      // Normalizar datos
      const normalizedData = { ...updateData };

      if (normalizedData.nombre) {
        normalizedData.nombre = normalizedData.nombre.trim();
      }

      if (normalizedData.descripcion) {
        normalizedData.descripcion = normalizedData.descripcion.trim();
      }

      const updatedProduct = await this.repository.update(id, normalizedData);
      
      return {
        ...updatedProduct,
        formattedPrice: `$${parseFloat(updatedProduct.precio).toFixed(2)}`
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un producto (hard delete)
   * @param {number} id - ID del producto
   * @returns {Promise<Object>}
   */
  async deleteProduct(id) {
    try {
      this.validateId(id);

      // Verificar que existe
      const product = await this.repository.findById(id);
      if (!product) {
        throw new NotFoundError(`Producto con ID ${id} no encontrado`);
      }

      // Regla de negocio: no permitir eliminar productos con pedidos pendientes
      // (aquí podrías verificar en otra tabla de pedidos/detalles_pedidos)
      
      await this.repository.delete(id);

      return {
        message: 'Producto eliminado exitosamente',
        deletedProduct: {
          id: product.id,
          nombre: product.nombre
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca productos por nombre
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Array>}
   */
  async searchProducts(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new ValidationError('El término de búsqueda debe tener al menos 2 caracteres');
      }

      const products = await this.repository.searchByName(searchTerm.trim());
      
      return products.map(product => ({
        ...product,
        formattedPrice: `$${parseFloat(product.precio).toFixed(2)}`,
        isLowStock: product.stock < 10,
        isOutOfStock: product.stock === 0
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene productos por categoría
   * @param {number} idCategoria - ID de la categoría
   * @returns {Promise<Array>}
   */
  async getProductsByCategory(idCategoria) {
    try {
      if (!idCategoria) {
        throw new ValidationError('El ID de categoría es requerido');
      }

      const products = await this.repository.findByCategory(parseInt(idCategoria));
      
      return products.map(product => ({
        ...product,
        formattedPrice: `$${parseFloat(product.precio).toFixed(2)}`,
        isLowStock: product.stock < 10,
        isOutOfStock: product.stock === 0
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza el stock de un producto
   * @param {number} id - ID del producto
   * @param {number} quantity - Cantidad a agregar/restar
   * @returns {Promise<Object>}
   */
  async updateProductStock(id, quantity) {
    try {
      this.validateId(id);

      if (typeof quantity !== 'number') {
        throw new ValidationError('La cantidad debe ser un número');
      }

      const product = await this.repository.findById(id);
      if (!product) {
        throw new NotFoundError(`Producto con ID ${id} no encontrado`);
      }

      // Regla de negocio: validar stock resultante
      const newStock = product.stock + quantity;
      if (newStock < 0) {
        throw new ValidationError(
          `Stock insuficiente. Stock actual: ${product.stock}, cantidad solicitada: ${Math.abs(quantity)}`
        );
      }

      const updatedProduct = await this.repository.updateStock(id, quantity);
      
      return {
        ...updatedProduct,
        stockChange: quantity,
        previousStock: product.stock,
        formattedPrice: `$${parseFloat(updatedProduct.precio).toFixed(2)}`
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene productos con stock bajo
   * @returns {Promise<Array>}
   */
  async getLowStockProducts() {
    try {
      const products = await this.repository.findLowStock(10);
      
      return products.map(product => ({
        ...product,
        formattedPrice: `$${parseFloat(product.precio).toFixed(2)}`,
        stockAlert: this.getStockAlert(product.stock)
      }));
    } catch (error) {
      throw error;
    }
  }

  // ============ MÉTODOS PRIVADOS DE VALIDACIÓN Y UTILIDADES ============

  /**
   * Valida los datos de un producto
   * @private
   */
  validateProductData(data) {
    const errors = [];

    if (!data.nombre || data.nombre.trim().length === 0) {
      errors.push('El nombre es requerido');
    }

    if (data.nombre && data.nombre.length > 255) {
      errors.push('El nombre no puede exceder 255 caracteres');
    }

    if (data.precio === undefined || data.precio === null) {
      errors.push('El precio es requerido');
    }

    if (isNaN(data.precio)) {
      errors.push('El precio debe ser un número válido');
    }

    if (errors.length > 0) {
      throw new ValidationError(`Errores de validación: ${errors.join(', ')}`);
    }
  }

  /**
   * Valida un ID (bigint)
   * @private
   */
  validateId(id) {
    if (!id) {
      throw new ValidationError('ID es requerido');
    }
    
    // Validar que sea un número válido (bigint)
    const numId = parseInt(id);
    if (isNaN(numId) || numId <= 0) {
      throw new ValidationError('ID debe ser un número positivo');
    }
  }

  /**
   * Obtiene el estado del stock
   * @private
   */
  getStockStatus(stock) {
    if (stock === 0) return 'Sin stock';
    if (stock < 10) return 'Stock bajo';
    if (stock < 50) return 'Stock normal';
    return 'Stock alto';
  }

  /**
   * Obtiene alerta de stock
   * @private
   */
  getStockAlert(stock) {
    if (stock === 0) return 'CRÍTICO: Producto agotado';
    if (stock <= 5) return 'URGENTE: Reponer stock inmediatamente';
    if (stock <= 10) return 'ADVERTENCIA: Stock bajo';
    return 'OK';
  }
}

// Exportar instancia singleton
export default new ProductService();
