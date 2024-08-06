import { Router } from 'express';
import { verifyToken } from "../middleware/validarToken";
import { estudiosMedicosController } from '../controllers/estudiosMedicosController';

class EstudiosMedicosRoutes {
    public router: Router = Router();

    constructor() {
        this.config();
    }

    config(): void {
        /**
         * @swagger
         * /api/autorizaciones:
         *   get:
         *     summary: Listar Autorizaciones.
         *     tags: [Autorizaciones]
         *     responses:
         *       200:
         *         description: Lista de Autorizaciones.
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: object
         *                 properties:
         *                   Numeroactualdelaprestacion:
         *                     type: integer
         *                     description: Número actual de la prestación.
         *                   NDEAUTORIZACION:
         *                     type: string
         *                     description: Número de autorización.
         *                   FECHARESPUESTAEPS:
         *                     type: string
         *                     format: date
         *                     description: Fecha de respuesta de EPS.
         *                   FechaVencimientoAUTORIZACION:
         *                     type: string
         *                     format: date
         *                     description: Fecha de vencimiento de la autorización.
         *                   NUMERO_PREAUTORIZACION:
         *                     type: string
         *                     description: Número de preautorización.
         */
        this.router.get('/', estudiosMedicosController.listEstudiosMedicos);

        /**
         * @swagger
         * /api/autorizaciones/error:
         *   get:
         *     summary: Listar Autorizaciones con error.
         *     tags: [Autorizaciones]
         *     responses:
         *       200:
         *         description: Lista de Autorizaciones con error.
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: object
         *                 properties:
         *                   error:
         *                     type: string
         *                     description: Descripción del error.
         */
        this.router.get('/error', estudiosMedicosController.listEstudiosMedicosError);

        /**
         * @swagger
         * /api/autorizaciones/excel:
         *   get:
         *     summary: Exportar Autorizaciones a Excel.
         *     tags: [Autorizaciones]
         *     responses:
         *       200:
         *         description: Archivo Excel exportado con la lista de Autorizaciones.
         *         content:
         *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
         *             schema:
         *               type: string
         *               format: binary
         */
        this.router.get('/excel', estudiosMedicosController.listEstudiosMedicosExcel);

        /**
         * @swagger
         * /api/autorizaciones/list:
         *   get:
         *     summary: Listar conceptos.
         *     tags: [Autorizaciones]
         *     responses:
         *       200:
         *         description: Lista de conceptos.
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: object
         *                 properties:
         *                   concepto:
         *                     type: string
         *                     description: Descripción del concepto.
         */
        this.router.get('/list', estudiosMedicosController.listConceptos);
    }
}

const estudiosMedicosRoutes = new EstudiosMedicosRoutes();
export default estudiosMedicosRoutes.router;