# Módulo de Notificaciones

Este módulo gestiona las notificaciones por correo electrónico para las notas de venta del sistema:
- Envío de notificaciones por SNS
- Procesamiento de mensajes de la cola SQS
- Notificaciones directas o a través de eventos

## Requisitos

- Node.js 18 o superior
- AWS DynamoDB
- AWS SNS
- AWS SQS

## Configuración

1. Copia el archivo `env.example` a `.env` y configura las variables:
   ```
   cp env.example .env
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

## Ejecución

### Desarrollo

```
npm run dev
```

### Producción

```
npm run build
npm start
```

## Docker

### Construir imagen

```
docker build -t notificaciones-app .
```

### Ejecutar contenedor

```
docker run -p 3002:3002 --env-file .env notificaciones-app
```

## Endpoints

### Notificaciones

- `POST /notificaciones`: Enviar notificación para una nota de venta específica

## Funcionamiento

El servicio funciona de dos maneras:

1. **Modo activo**: A través del endpoint `POST /notificaciones` se pueden enviar notificaciones manualmente.

2. **Modo pasivo**: El servicio escucha continuamente una cola SQS para recibir eventos de notas de venta generadas y enviar las notificaciones correspondientes.

Las notificaciones se envían usando Amazon SNS a los ARNs configurados para cada cliente. 