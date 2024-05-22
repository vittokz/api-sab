import {Request, Response, NextFunction} from 'express';
const jwt = require('jsonwebtoken');

export const verifyToken = (req: Request, res: Response, next: NextFunction) =>{
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader !== 'undefined'){
       const token = bearerHeader.split(" ")[1];
       jwt.verify(token,'secretkey',(error: any)=>{
            if(error){
                res.json({
                    mensaje: "Acceso denegado",
                   
                });
            }
            else{
                res.locals.token = token;
                next();
             }
       });
    }
    else{
        res.json({
            mensaje:" error de acceso"
        });
    }
    
}