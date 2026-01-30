/**
 * CAPA DE SERVICES (Business Logic Layer)
 *
 * Categorías de producto (categorias_producto)
 * - PK: id_categoria (bigint)
 * - nombre: text NOT NULL UNIQUE
 */

import categoriaRepository from '../repositories/CategoriaRepository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class CategoriaService {
    constructor(repository = categoriaRepository) {
        this.repository = repository;
    }

    /**
     * Obtiene todas las categorías ordenadas
     * @returns {Promise<Array>}
     */
    async getAllCategorias() {
        return await this.repository.getAllCategorias();
    }

    /**
     * Obtiene una categoría por ID
     * @param {number|string} idCategoria
     * @returns {Promise<Object>}
     */
    async getCategoriaById(idCategoria) {
        this.validateId(idCategoria);

        const categoria = await this.repository.findById(parseInt(idCategoria));
        if (!categoria) {
            throw new NotFoundError(`Categoría con ID ${idCategoria} no encontrada`);
        }

        return categoria;
    }

    /**
     * Obtiene una categoría por ID con conteo de productos
     * @param {number|string} idCategoria
     * @returns {Promise<Object>}
     */
    async getCategoriaByIdWithProductCount(idCategoria) {
        this.validateId(idCategoria);

        const categoria = await this.repository.findByIdWithProductCount(parseInt(idCategoria));
        if (!categoria) {
            throw new NotFoundError(`Categoría con ID ${idCategoria} no encontrada`);
        }

        return categoria;
    }

    /**
     * Obtiene todas las categorías con conteo de productos
     * @returns {Promise<Array>}
     */
    async getAllCategoriasWithProductCount() {
        return await this.repository.getAllWithProductCount();
    }

    /**
     * Crea una nueva categoría
     * @param {Object} data
     * @param {string} data.nombre
     */
    async createCategoria(data) {
        this.validateCategoriaData(data);

        const normalized = {
            nombre: data.nombre.trim()
        };

        const existing = await this.repository.findByNombre(normalized.nombre);
        if (existing) {
            throw new ValidationError(`Ya existe una categoría con el nombre "${normalized.nombre}"`);
        }

        return await this.repository.create(normalized);
    }

    /**
     * Actualiza una categoría
     * @param {number|string} idCategoria
     * @param {Object} updateData
     */
    async updateCategoria(idCategoria, updateData) {
        this.validateId(idCategoria);

        const id = parseInt(idCategoria);
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new NotFoundError(`Categoría con ID ${idCategoria} no encontrada`);
        }

        const normalized = { ...updateData };
        if (normalized.nombre !== undefined) {
            if (!normalized.nombre || normalized.nombre.trim().length === 0) {
                throw new ValidationError('El nombre es requerido');
            }

            normalized.nombre = normalized.nombre.trim();

            if (normalized.nombre !== existing.nombre) {
                const withSameName = await this.repository.findByNombre(normalized.nombre);
                if (withSameName && withSameName.id_categoria !== id) {
                    throw new ValidationError(`Ya existe una categoría con el nombre "${normalized.nombre}"`);
                }
            }
        }

        return await this.repository.update(id, normalized);
    }

    /**
     * Elimina una categoría
     * @param {number|string} idCategoria
     */
    async deleteCategoria(idCategoria) {
        this.validateId(idCategoria);

        const id = parseInt(idCategoria);
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new NotFoundError(`Categoría con ID ${idCategoria} no encontrada`);
        }

        // Regla de negocio posible: no permitir eliminar si tiene productos.
        // Si quieres habilitarlo, podemos revisar conteo con getCategoriaByIdWithProductCount.

        await this.repository.delete(id);
        return {
            message: 'Categoría eliminada exitosamente',
            deletedCategory: {
                id_categoria: existing.id_categoria,
                nombre: existing.nombre
            }
        };
    }

    // ===== Validaciones =====

    validateId(id) {
        if (id === undefined || id === null || id === '') {
            throw new ValidationError('ID es requerido');
        }

        const numId = parseInt(id);
        if (isNaN(numId) || numId <= 0) {
            throw new ValidationError('ID debe ser un número positivo');
        }
    }

    validateCategoriaData(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            errors.push('Datos de categoría inválidos');
        } else {
            if (!data.nombre || data.nombre.trim().length === 0) {
                errors.push('El nombre es requerido');
            }
            if (data.nombre && data.nombre.length > 255) {
                errors.push('El nombre no puede exceder 255 caracteres');
            }
        }

        if (errors.length > 0) {
            throw new ValidationError(`Errores de validación: ${errors.join(', ')}`);
        }
    }
}

export default new CategoriaService();