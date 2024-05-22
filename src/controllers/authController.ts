import { Request, Response, query } from "express";
const jwt = require("jsonwebtoken");

class AuthController {
  //validar inicio de session
  public async validar(req: Request, res: Response): Promise<any> {
    const data = [{
        id: '1085255976',
        pw: '123456789'
    }];
    if (data.length > 0) {
      const token = jwt.sign({ user: data }, "secretkey");
      return res.json({
        token: token,
        acceso: data,
        idError: 0,
      });
    }
    return res.json({
      message: "El usuario no existe",
      idError: 1,
    });
  }
}

export const authController = new AuthController();
