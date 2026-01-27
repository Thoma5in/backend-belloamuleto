# 🏗️ Backend Bello Amuleto - Arquitectura en Capas

Backend Node.js con Express y Supabase siguiendo **Arquitectura en Capas** para desacoplar la lógica de negocio del proveedor de base de datos.

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 3. Crear tabla en Supabase
# Ejecutar el script database-setup.sql en Supabase SQL Editor

# 4. Iniciar servidor
npm run dev
```

**Servidor corriendo en:** `http://localhost:3000`

---

## 📚 Documentación

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura completa, flujos y decisiones técnicas
- **[QUICK_GUIDE.md](./QUICK_GUIDE.md)** - Guía rápida para agregar nuevas features
- **[database-setup.sql](./database-setup.sql)** - Script SQL para crear tablas
- **[api-tests.http](./api-tests.http)** - Tests de API (usa REST Client de VS Code)

---

## 🏗️ Arquitectura

```
Cliente HTTP
    ↓
┌─────────────────────────┐
│  Routes/Controllers     │  → Manejo HTTP
│  (Presentation Layer)   │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  Services               │  → Lógica de negocio
│  (Business Layer)       │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  Repositories           │  → Acceso a datos
│  (Data Access Layer)    │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  Config/Database        │  → Infraestructura
│  (Infrastructure)       │
└──────────┬──────────────┘
           ↓
        Supabase
```

---

## 📁 Estructura

```
src/
├── config/              # Configuración e infraestructura
│   ├── database.js      # Abstracción del cliente BD
│   ├── supabase.js      # Cliente Supabase
│   └── jwt.js
├── repositories/        # Acceso a datos (única capa que toca BD)
│   ├── BaseRepository.js
│   └── ProductRepository.js
├── services/            # Lógica de negocio
│   └── ProductService.js
├── controllers/         # Manejo HTTP
│   └── ProductController.js
├── routes/              # Definición de endpoints
│   ├── index.js
│   └── productRoutes.js
├── middlewares/         # Middlewares de Express
│   ├── errorHandler.js
│   └── logger.js
├── utils/               # Utilidades
│   └── errors.js
├── app.js               # Configuración Express
└── server.js            # Inicio del servidor
```

---

## 🔄 Ejemplo de Flujo Completo

### Request: `GET /api/products/123`

```
1. Route          → router.get('/:id', productController.getProductById)
2. Controller     → extrae ID, llama a service
3. Service        → valida, aplica lógica de negocio, llama a repository
4. Repository     → ejecuta query en Supabase
5. Config/DB      → provee cliente Supabase
6. Service        → enriquece datos (calcula campos adicionales)
7. Controller     → formatea respuesta HTTP
8. Response       → { success: true, data: {...} }
```

---

## 🎯 Responsabilidades de Cada Capa

| Capa | ✅ SÍ Debe | ❌ NO Debe |
|------|-----------|-----------|
| **Controllers** | Extraer params, validar formato, llamar services, formatear HTTP | Lógica de negocio, acceder a BD |
| **Services** | Validar reglas de negocio, orquestar, transformar datos | Conocer HTTP, acceder a BD directamente |
| **Repositories** | CRUD, queries, mapeo de datos | Lógica de negocio, validaciones de negocio |
| **Config** | Conexiones, variables entorno, clientes singleton | Lógica de negocio, operaciones de datos |

---

## 📡 API Endpoints

### Productos
- `GET /api/products` - Listar con paginación/filtros
- `GET /api/products/:id` - Obtener por ID
- `GET /api/products/search?q=término` - Buscar
- `GET /api/products/category/:category` - Por categoría
- `GET /api/products/low-stock` - Stock bajo
- `POST /api/products` - Crear
- `PUT /api/products/:id` - Actualizar
- `PATCH /api/products/:id/stock` - Actualizar stock
- `DELETE /api/products/:id` - Eliminar (soft delete)

---

## 🛠️ Tecnologías

- **Node.js** - Runtime
- **Express** - Framework web
- **Supabase** - Base de datos (PostgreSQL)
- **@supabase/supabase-js** - SDK oficial
- **dotenv** - Variables de entorno

---

## ⚙️ Scripts

```bash
npm run dev     # Desarrollo con auto-reload (nodemon)
npm start       # Producción
```

---

## 🔐 Variables de Entorno

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3000
NODE_ENV=development
```

---

## ✨ Características Destacadas

✅ **Arquitectura desacoplada** - Cambiar Supabase es fácil  
✅ **BaseRepository** - CRUD genérico reutilizable  
✅ **Manejo de errores centralizado** - Respuestas consistentes  
✅ **Soft delete** - No se pierden datos  
✅ **Validaciones en múltiples capas** - Seguridad robusta  
✅ **Async/await** en todas las capas  
✅ **Singleton patterns** - Instancias únicas  
✅ **Dependency Injection** - Testing fácil  

---

## 🧪 Testing (Próximamente)

```javascript
// Service con repository mockeado
const mockRepo = { findById: jest.fn() };
const service = new ProductService(mockRepo);
```

---

## 📖 Aprende Más

- **¿Nuevo en el proyecto?** → Lee [ARCHITECTURE.md](./ARCHITECTURE.md)
- **¿Quieres agregar features?** → Lee [QUICK_GUIDE.md](./QUICK_GUIDE.md)
- **¿Problemas con BD?** → Revisa [database-setup.sql](./database-setup.sql)
- **¿Testear API?** → Usa [api-tests.http](./api-tests.http)

---

## 🤝 Contribuir

Al contribuir, mantén la arquitectura:
1. ❌ NO accedas a Supabase fuera de repositories
2. ❌ NO pongas lógica de negocio en controllers
3. ✅ SÍ usa los errores personalizados
4. ✅ SÍ documenta tus decisiones

---

## 📝 Licencia

ISC

---

**Desarrollado siguiendo principios SOLID y Clean Architecture** 🏛️