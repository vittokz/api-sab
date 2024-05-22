import { Request, Response } from "express";
const pool = require("../database");

class EstudiosMedicosController {


  public async listEstudiosMedicos(req: Request, res: Response) {
    try {
      // Realiza la consulta y espera a que se complete
      // let sql = "SELECT * FROM datos WHERE FSolicitud BETWEEN '26-abr-24' AND '26-abr-24' LIMIT 2;";
      let sql =
      "SELECT Numeroactualdelaprestacion,NDEAUTORIZACION,FECHARESPUESTAEPS,FechaVencimientoAUTORIZACION,NUMERO_PREAUTORIZACION FROM datos WHERE estado = 0 LIMIT 5";
      pool.query(sql, (err: any, rows: any, fields: any) => {
        if (err) throw err;

        const regex = {
          soloNumeros: /^\d{1,20}$/,
          alfanumericos: /^(?!\s*$).{1,150}$/,
          fecha: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/,
          preautorizacion: /^\s*([^\s].{0,59})?\s*$/,
        };
    
        let validRows: any[] = [];
        let errors: any[] = [];
    
        rows.forEach((row: any) => {
          let errorMessages = [];
    
          if (!regex.soloNumeros.test(row.Numeroactualdelaprestacion)) {
            errorMessages.push(
              "Valor no válido en Numero actual de la prestacion: " + row.Numeroactualdelaprestacion
            );
          }
          if (!regex.alfanumericos.test(row.NDEAUTORIZACION)) {
            errorMessages.push(
              "Valor no válido en N DE AUTORIZACION: " + row.NDEAUTORIZACION
            );
          }
          if (!regex.fecha.test(row.FECHARESPUESTAEPS)) {
            errorMessages.push(
              "Valor no válido en FECHA RESPUESTA EPS: " + row.FECHARESPUESTAEPS
            );
          }
          if (!regex.fecha.test(row.FechaVencimientoAUTORIZACION)) {
            errorMessages.push(
              "Valor no válido en FECHA Vencimiento AUTORIZACION: " + row.FechaVencimientoAUTORIZACION
            );
          }
          if (!regex.alfanumericos.test(row.NUMERO_PREAUTORIZACION)) {
            errorMessages.push(
              "Valor no válido en NUMERO_PREAUTORIZACION: " + row.NUMERO_PREAUTORIZACION
            );
          }
          if (regex.fecha.test(row.FECHARESPUESTAEPS) && regex.fecha.test(row.FechaVencimientoAUTORIZACION)) {
            const fechaRespuestaEps = new Date(row.FECHARESPUESTAEPS.split("/").reverse().join("-"));
            const fechaVencimientoAutorizacion = new Date(row.FechaVencimientoAUTORIZACION.split("/").reverse().join("-"));
            if (fechaVencimientoAutorizacion <= fechaRespuestaEps) {
              errorMessages.push(
                "Fecha de Vencimiento de Autorización debe ser mayor que Fecha de Respuesta EPS: " + row.FechaVencimientoAUTORIZACION
              );
            }
          }
    
          if (errorMessages.length > 0) {
            errors.push({
              row: row,
              errors: errorMessages,
            });
          } else {
            validRows.push({
              Numeroactualdelaprestacion: row.Numeroactualdelaprestacion,
              FECHARESPUESTAEPS: row.FECHARESPUESTAEPS,
              FechaVencimientoAUTORIZACION: row.FechaVencimientoAUTORIZACION,
              NUMERO_PREAUTORIZACION: row.NUMERO_PREAUTORIZACION,
              NDEAUTORIZACION: row.NDEAUTORIZACION,
            });
          }
        });
    
        return res.status(200).json({
          validRows: validRows,
          errors: errors,
        });
        
      });
    } catch (error) {
      console.error("Error al obtener los estudios médicos :", error);
      res
        .status(500)
        .json({ error: "Error al obtener los estudios médicos." + error });
    }
  }
}

export const estudiosMedicosController = new EstudiosMedicosController();
