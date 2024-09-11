import { Request, Response } from "express";
const bcrypt = require("bcryptjs");
const db = require("../database");

class UsuariosController {
  //validar inicio de session
  public async crear(req: Request, res: Response): Promise<any> {
    const { nombre, apellido, documento_identidad, telefono, email, password } =
      req.body;
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insertar el nuevo usuario en la base de datos
    db.query(
      "INSERT INTO users_autorizaciones (nombre, apellido, documento_identidad, telefono, email, password) VALUES (?, ?, ?, ?, ?, ?)",
      [nombre, apellido, documento_identidad, telefono, email, hashedPassword],
      (err: any, result: any) => {
        if (err) {
          return res
            .status(500)
            .json({
              status: "error",
              message: "Error al registrar usuario",
              result: err.sqlMessage,
            });
        }
        res
          .status(201)
          .json({
            status: "success",
            message: "Usuario registrado con éxito",
            result: req.body,
          });
      }
    );
  }

  // Método para consultar un usuario por documento_identidad
  public async getUsuarioById(req: Request, res: Response): Promise<any> {
    const { documento_identidad } = req.params;  // Obtener el documento_identidad de los parámetros de la URL
  
  // Consulta SQL para buscar el usuario
  db.query(
    "SELECT * FROM users_autorizaciones WHERE documento_identidad = ?",
    [documento_identidad],
    (err: any, result: any) => {
      if (err) {
        return res.status(500).json({ status: "error", message: "Error al consultar usuario", result: err.sqlMessage });
      }
      
      // Verificar si el usuario existe
      if (result.length === 0) {
        return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
      }
      
      // Devolver el resultado del usuario
      res.status(200).json({ status: "success", message: "Usuario encontrado", usuario: result[0] });
    }
  );
  }
}

export const usuariosController = new UsuariosController();
