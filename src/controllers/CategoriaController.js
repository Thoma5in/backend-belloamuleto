import categoriaService from '../services/CategoriaService.js';
import { ValidationError } from '../utils/errors.js';

export class CategoriaController {
    constructor(service = categoriaService) {
        this.service = service;

        this.listarCategorias = this.listarCategorias.bind(this);
        this.getCategoriaById = this.getCategoriaById.bind(this);
        this.getCategoriasWithProductCount = this.getCategoriasWithProductCount.bind(this);
        this.createCategoria = this.createCategoria.bind(this);
        this.updateCategoria = this.updateCategoria.bind(this);
        this.deleteCategoria = this.deleteCategoria.bind(this);
    }

    async listarCategorias(req, res, next) {
        try {
            const categorias = await this.service.getAllCategorias();
            res.status(200).json({
                success: true,
                data: categorias,
                count: categorias.length
            });
        } catch (error) {
            next(error);
        }
    }

    async getCategoriaById(req, res, next) {
        try {
            const { idCategoria } = req.params;
            const categoria = await this.service.getCategoriaById(idCategoria);

            res.status(200).json({
                success: true,
                data: categoria
            });
        } catch (error) {
            next(error);
        }
    }

    async getCategoriasWithProductCount(req, res, next) {
        try {
            const categorias = await this.service.getAllCategoriasWithProductCount();

            res.status(200).json({
                success: true,
                data: categorias,
                count: categorias.length
            });
        } catch (error) {
            next(error);
        }
    }

    async createCategoria(req, res, next) {
        try {
            if (!req.body?.nombre) {
                throw new ValidationError('El campo "nombre" es requerido');
            }

            const categoria = await this.service.createCategoria({ nombre: req.body.nombre });

            res.status(201).json({
                success: true,
                message: 'Categoría creada exitosamente',
                data: categoria
            });
        } catch (error) {
            next(error);
        }
    }

    async updateCategoria(req, res, next) {
        try {
            const { idCategoria } = req.params;
            const { id_categoria, ...updateData } = req.body || {};

            if (!updateData || Object.keys(updateData).length === 0) {
                throw new ValidationError('No hay datos para actualizar');
            }

            const categoria = await this.service.updateCategoria(idCategoria, updateData);

            res.status(200).json({
                success: true,
                message: 'Categoría actualizada exitosamente',
                data: categoria
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteCategoria(req, res, next) {
        try {
            const { idCategoria } = req.params;
            const result = await this.service.deleteCategoria(idCategoria);

            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new CategoriaController();