-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.carritos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  usuario_id bigint NOT NULL,
  fecha_creacion timestamp with time zone DEFAULT now(),
  CONSTRAINT carritos_pkey PRIMARY KEY (id),
  CONSTRAINT carritos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.categorias_producto (
  id_categoria bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre text NOT NULL UNIQUE,
  CONSTRAINT categorias_producto_pkey PRIMARY KEY (id_categoria)
);
CREATE TABLE public.cupones (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  codigo text NOT NULL UNIQUE,
  descuento numeric NOT NULL,
  fecha_expiracion date,
  uso_maximo integer,
  CONSTRAINT cupones_pkey PRIMARY KEY (id)
);
CREATE TABLE public.detalles_carritos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  carrito_id bigint NOT NULL,
  producto_id bigint NOT NULL,
  cantidad integer NOT NULL,
  CONSTRAINT detalles_carritos_pkey PRIMARY KEY (id),
  CONSTRAINT detalles_carritos_carrito_id_fkey FOREIGN KEY (carrito_id) REFERENCES public.carritos(id),
  CONSTRAINT detalles_carritos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);
CREATE TABLE public.detalles_pedidos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  pedido_id bigint NOT NULL,
  producto_id bigint NOT NULL,
  cantidad integer NOT NULL,
  precio_unitario numeric NOT NULL,
  CONSTRAINT detalles_pedidos_pkey PRIMARY KEY (id),
  CONSTRAINT detalles_pedidos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id),
  CONSTRAINT detalles_pedidos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);
CREATE TABLE public.envios (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  pedido_id bigint NOT NULL,
  metodo_envio text NOT NULL,
  costo numeric NOT NULL,
  estado text NOT NULL,
  fecha_envio timestamp with time zone,
  fecha_entrega_estimada timestamp with time zone,
  CONSTRAINT envios_pkey PRIMARY KEY (id),
  CONSTRAINT envios_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id)
);
CREATE TABLE public.imagenes_productos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  producto_id bigint NOT NULL,
  url text NOT NULL,
  CONSTRAINT imagenes_productos_pkey PRIMARY KEY (id),
  CONSTRAINT imagenes_productos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);
CREATE TABLE public.listas_deseos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  usuario_id bigint NOT NULL,
  producto_id bigint NOT NULL,
  fecha_agregado timestamp with time zone DEFAULT now(),
  CONSTRAINT listas_deseos_pkey PRIMARY KEY (id),
  CONSTRAINT listas_deseos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT listas_deseos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);
CREATE TABLE public.notificaciones (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  usuario_id bigint NOT NULL,
  mensaje text NOT NULL,
  leido boolean DEFAULT false,
  fecha timestamp with time zone DEFAULT now(),
  CONSTRAINT notificaciones_pkey PRIMARY KEY (id),
  CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.pedidos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  usuario_id bigint NOT NULL,
  fecha timestamp with time zone DEFAULT now(),
  total numeric NOT NULL,
  CONSTRAINT pedidos_pkey PRIMARY KEY (id),
  CONSTRAINT pedidos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.productos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  precio numeric NOT NULL,
  stock integer NOT NULL,
  id_categoria bigint,
  CONSTRAINT productos_pkey PRIMARY KEY (id),
  CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (id_categoria) REFERENCES public.categorias_producto(id_categoria)
);
CREATE TABLE public.reseñas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  producto_id bigint NOT NULL,
  usuario_id bigint NOT NULL,
  calificacion integer NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario text,
  fecha timestamp with time zone DEFAULT now(),
  CONSTRAINT reseñas_pkey PRIMARY KEY (id),
  CONSTRAINT reseñas_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id),
  CONSTRAINT reseñas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.soporte (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  usuario_id bigint NOT NULL,
  asunto text NOT NULL,
  mensaje text NOT NULL,
  estado text DEFAULT 'abierto'::text,
  fecha_creacion timestamp with time zone DEFAULT now(),
  fecha_resolucion timestamp with time zone,
  CONSTRAINT soporte_pkey PRIMARY KEY (id),
  CONSTRAINT soporte_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.transacciones (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  pedido_id bigint NOT NULL,
  metodo_pago text NOT NULL,
  estado text NOT NULL,
  fecha timestamp with time zone DEFAULT now(),
  total numeric NOT NULL,
  CONSTRAINT transacciones_pkey PRIMARY KEY (id),
  CONSTRAINT transacciones_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id)
);
CREATE TABLE public.usuarios (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  auth_user_id uuid NOT NULL,
  nombre text NOT NULL,
  email text NOT NULL UNIQUE,
  direccion text,
  telefono text,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id),
  CONSTRAINT fk_usuarios_auth_user_id FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);

create table public.roles (
  id uuid not null default gen_random_uuid (),
  nombre text not null,
  descripcion text null,
  creado_en timestamp with time zone not null default now(),
  constraint roles_pkey primary key (id),
  constraint roles_nombre_key unique (nombre)
) TABLESPACE pg_default;

create table public.empleados (
  usuario_id uuid not null,
  numero_empleado text null,
  fecha_contratacion date null,
  departamento text null,
  activo boolean not null default true,
  creado_en timestamp with time zone not null default now(),
  constraint empleados_pkey primary key (usuario_id),
  constraint empleados_numero_empleado_key unique (numero_empleado),
  constraint empleados_usuario_id_fkey foreign KEY (usuario_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.empleados_roles (
  id uuid not null default gen_random_uuid (),
  empleado_id uuid not null,
  rol_id uuid not null,
  otorgado_por uuid null,
  otorgado_en timestamp with time zone not null default now(),
  constraint empleados_roles_pkey primary key (id),
  constraint empleados_roles_unico unique (empleado_id, rol_id),
  constraint empleados_roles_empleado_id_fkey foreign KEY (empleado_id) references empleados (usuario_id) on delete CASCADE,
  constraint empleados_roles_otorgado_por_fkey foreign KEY (otorgado_por) references auth.users (id),
  constraint empleados_roles_rol_id_fkey foreign KEY (rol_id) references roles (id) on delete CASCADE
) TABLESPACE pg_default;