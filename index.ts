import express, { Request, Response } from 'express';
import AWS from 'aws-sdk';
import bodyParser from 'body-parser';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { createMetricsService } from './metrics';

// Configuración de AWS
AWS.config.update({ region: 'us-east-1' });

// Configuración de clientes AWS
const snsClient = new SNSClient({ region: 'us-east-1' });

// Mapeo de clientes a ARNs de SNS
const clienteArnMap: { [key: string]: string } = {
  'c1cfad3e-f875-446e-82fd-96142a0c19eb': 'arn:aws:sns:us-east-1:150129944828:Examen-1', //Yo: jesus.castellanos
  'cf37d125-8dac-47e7-9739-d708ee8b4c00': 'arn:aws:sns:us-east-1:150129944828:Examen-1-2' //Yo: duskylalo35
};

// Inicializar Express
const app = express();
app.use(bodyParser.json());

// Servicio de métricas
const metricsService = createMetricsService();

// Nuevo endpoint para recibir notificaciones directamente desde el servicio de notas de venta
app.post('/notificar-venta', async (req: Request, res: Response) => {
    const startTime = Date.now();
    const endpoint = 'POST /notificar-venta';
    const { notaVentaId, clienteId, downloadLink } = req.body;
    
    if (!notaVentaId || !clienteId || !downloadLink) {
        res.status(400).json({ error: 'Se requieren los campos notaVentaId, clienteId y downloadLink' });
        metricsService.incrementHttpCounter('4xx');
        return;
    }

    try {
        // Obtener el ARN del cliente
        const endpointArn = clienteArnMap[clienteId];

        if (!endpointArn) {
            res.status(400).json({ error: 'Cliente no tiene ARN configurado para notificaciones' });
            metricsService.incrementHttpCounter('4xx');
            return;
        }

        // Enviar notificación por SNS
        await enviarNotificacion(endpointArn, notaVentaId, downloadLink);

        res.status(200).json({ message: 'Notificación enviada correctamente' });
        metricsService.incrementHttpCounter('2xx');
    } catch (error) {
        console.error('Error al enviar notificación:', error);
        res.status(500).json({ error: 'Error al enviar notificación', details: error });
        metricsService.incrementHttpCounter('5xx');
    } finally {
        const endTime = Date.now();
        metricsService.recordResponseTime(endTime - startTime, endpoint);
    }
});

// Función para enviar notificación
async function enviarNotificacion(endpointArn: string, notaVentaId: string, downloadLink: string) {
    const mensaje = {
        TargetArn: endpointArn,
        Message: `Se ha generado una nota de venta con ID ${notaVentaId}. Descárguela aquí: ${downloadLink}`,
        Subject: 'Nota de venta generada',
        MessageStructure: 'string'
    };

    try {
        await snsClient.send(new PublishCommand(mensaje));
        console.log(`Notificación enviada para la nota ${notaVentaId} al ARN ${endpointArn}`);
    } catch (error) {
        console.error(`Error al enviar notificación SNS para la nota ${notaVentaId}:`, error);
        throw error;
    }
}

// Iniciar servidor
const port = 3002;
app.listen(port, () => {
    console.log(`Servicio de notificaciones ejecutándose en puerto ${port}`);
}); 