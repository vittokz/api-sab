import { Router } from 'express';
import { usuariosController } from '../controllers/usuariosController';

class UsuariosRoutes {

    public router: Router = Router();
    
    constructor() {
        this.config();
    }

    /**
     * @swagger
     * /usuarios:
     *   post:
     *     summary: Crea un nuevo usuario.
     *     description: Esta ruta permite crear un nuevo usuario en la base de datos.
     *     tags:
     *       - Usuarios
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nombre:
     *                 type: string
     *                 description: Nombre del usuario.
     *                 example: "Juan"
     *               apellido:
     *                 type: string
     *                 description: Apellido del usuario.
     *                 example: "Pérez"
     *               documento_identidad:
     *                 type: string
     *                 description: Documento de identidad del usuario.
     *                 example: "1085255976"
     *               telefono:
     *                 type: string
     *                 description: Teléfono del usuario.
     *                 example: "3001234567"
     *               email:
     *                 type: string
     *                 description: Correo electrónico del usuario.
     *                 example: "juan.perez@example.com"
     *               password:
     *                 type: string
     *                 description: Contraseña del usuario.
     *                 example: "123456"
     *     responses:
     *       201:
     *         description: Usuario creado con éxito.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "success"
     *                 message:
     *                   type: string
     *                   example: "Usuario registrado con éxito"
     *                 result:
     *                   type: object
     *                   properties:
     *                     nombre:
     *                       type: string
     *                     apellido:
     *                       type: string
     *                     documento_identidad:
     *                       type: string
     *                     telefono:
     *                       type: string
     *                     email:
     *                       type: string
     *       500:
     *         description: Error al registrar usuario.
     * 
     * /usuarios/{documento_identidad}:
     *   get:
     *     summary: Obtiene un usuario por su documento de identidad.
     *     description: Esta ruta permite obtener los detalles de un usuario utilizando su documento de identidad.
     *     tags:
     *       - Usuarios
     *     parameters:
     *       - in: path
     *         name: documento_identidad
     *         required: true
     *         schema:
     *           type: string
     *         description: El documento de identidad del usuario.
     *         example: "1085255976"
     *     responses:
     *       200:
     *         description: Usuario encontrado.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 nombre:
     *                   type: string
     *                 apellido:
     *                   type: string
     *                 documento_identidad:
     *                   type: string
     *                 telefono:
     *                   type: string
     *                 email:
     *                   type: string
     *       404:
     *         description: Usuario no encontrado.
     *       500:
     *         description: Error al consultar usuario.
     */
    config(): void {
        this.router.post('/', usuariosController.crear); 
        this.router.get('/:documento_identidad', usuariosController.getUsuarioById); 
    }
}

const usuariosRoutes = new UsuariosRoutes();
export default usuariosRoutes.router;
