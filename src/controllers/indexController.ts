import { Request, Response } from "express";

class IndexController {
  public index(req: Request, res: Response) {
    res.json({
      text: "Api esta corriendo",
    });
  }
}

export const indexController = new IndexController();
