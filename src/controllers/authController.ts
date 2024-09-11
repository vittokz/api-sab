import { Request, Response } from "express";
const jwt = require("jsonwebtoken");
import bcrypt from 'bcrypt';
const db = require("../database");

class AuthController {
  //validar inicio de session
  public async validar(req: Request, res: Response): Promise<any> {
    const { id, pw } = req.body;
    // Consultar el usuario en la base de datos por documento_identidad
    db.query(
      "SELECT * FROM users_autorizaciones WHERE documento_identidad = ?",
      [id],
      async (err: any, result: any) => {
        if (err) {
          return res.status(500).json({ status: "error", message: "Error al consultar usuario", result: err.sqlMessage });
        }
  
        // Verificar si el usuario existe
        if (result.length === 0) {
          return res.status(404).json({ message: "El usuario no existe" });
        }
  
        const user = result[0];
  
        // Comparar la contraseña proporcionada con la almacenada (hashed) en la base de datos
        const passwordMatch = await bcrypt.compare(pw, user.password);
  
        if (passwordMatch) {
          // Generar un token JWT
          const token = jwt.sign({ user: { id: user.documento_identidad } }, "secretkey", { expiresIn: '1h' });
  
          return res.json({
            token: token,
            user: {
              id: user.id,
              documento_identidad: user.documento_identidad,
              nombre: user.nombre,
              apellido: user.apellido,
              email: user.email,
              telefono: user.telefono
            }
          });
        } else {
          // La contraseña no coincide
          return res.status(401).json({
            message: "Las credenciales son incorrectas",
            usuario: {
              id
            },
          });
        }
      }
    );
  }
}

export const authController = new AuthController();
