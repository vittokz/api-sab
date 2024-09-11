import { Request, Response } from "express";
import * as XLSX from "xlsx";
import { EnumObservacionesAprobadas } from "../enum/observacionesAprobadas";
import { promisify } from 'util';

const pool = require("../database");
const regexPatterns = {
  soloNumeros: /^\d{1,20}$/,
  alfanumericos: /^(?!\s*$).+/,
  //fecha: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/,
  fecha: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
  preautorizacion: /^\s*([^\s].{0,59})?\s*$/,
};
const sqlQuery =
  "SELECT `Número actual de la prestación` AS Numeroactualdelaprestacion, `N_DE_AUTORIZACION` AS NDEAUTORIZACION,   `FECHA_RESPUESTA_EPS` AS FECHARESPUESTAEPS,   `Fecha_Vencimiento_AUTORIZACION` AS FechaVencimientoAUTORIZACION,   NUMERO_PREAUTORIZACION FROM bas_aut_ambulatoria WHERE estado = 0 LIMIT 500;";
const sqlQueryConceptos = "SELECT * FROM reglas_proceso_auto";

class EstudiosMedicosController {
  constructor() {
    this.listEstudiosMedicos = this.listEstudiosMedicos.bind(this);
    this.listEstudiosMedicosError = this.listEstudiosMedicosError.bind(this);
    this.listEstudiosMedicosExcel = this.listEstudiosMedicosExcel.bind(this);
    this.processRows = this.processRows.bind(this);
    this.validateRow = this.validateRow.bind(this);
    this.convertDateFechaAnoMesDiaHora =
      this.convertDateFechaAnoMesDiaHora.bind(this);
    this.convertDateFormat = this.convertDateFormat.bind(this);
    this.isValidEstado = this.isValidEstado.bind(this);
    this.isValidEstadoPreautorizacion =
      this.isValidEstadoPreautorizacion.bind(this);
    this.listConceptos = this.listConceptos.bind(this);
  }

  convertToDateObject(dateString: string): Date {
    return new Date(dateString);
  }

  isDateSmaller(dateString1: string, dateString2: string): boolean {
    const date1 = this.convertToDateObject(dateString1);
    const date2 = this.convertToDateObject(dateString2);

    return date1 < date2;
  }
  convertDateFormat(dateString: string): string {
    // Convert the date string to a Date object
    const date = new Date(dateString.replace(" ", "T") + "Z");
    if (!isNaN(date.getTime())) {
      // Format the date to the desired format
      const year = date.getUTCFullYear();
      const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
      const day = date.getUTCDate().toString().padStart(2, "0");
      const hours = date.getUTCHours().toString().padStart(2, "0");
      const minutes = date.getUTCMinutes().toString().padStart(2, "0");
      const seconds = date.getUTCSeconds().toString().padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
    } else {
      return dateString;
    }
  }

  validateRow(row: any, rowsConceptos: any) {
    const errors = [];
    
    if(row.FECHARESPUESTAEPS !== null && row.FECHARESPUESTAEPS !== ''){
      row.FECHARESPUESTAEPS = this.convertDateFechaAnoMesDiaHora(
        row.FECHARESPUESTAEPS
      );
    }
    if(row.FechaVencimientoAUTORIZACION !== null && row.FechaVencimientoAUTORIZACION !== ''){
      row.FechaVencimientoAUTORIZACION = this.convertDateFechaAnoMesDiaHora(
        row.FechaVencimientoAUTORIZACION
      );
    }
    let estadoProceso1 = 0;

    if (!regexPatterns.soloNumeros.test(row.Numeroactualdelaprestacion)) {
      errors.push(
        `Valor no válido en Numero actual de la prestación: ${
          row.Numeroactualdelaprestacion || null
        }`
      );
    }
    // Validar el campo N de Autorización según el campo Numero_Preautorizacion primer proceso
    if (row.NUMERO_PREAUTORIZACION) {
      if (
        this.isValidEstadoPreautorizacion(
          row.NUMERO_PREAUTORIZACION,
          rowsConceptos,
          "1"
        )
      ) {
        estadoProceso1 = 0;
      } else {
        //Validación segundo proceso
        if (
          this.isValidEstadoPreautorizacion(
            row.NUMERO_PREAUTORIZACION,
            rowsConceptos,
            "2"
          )
        ) {
          estadoProceso1 = 2;
          row.NDEAUTORIZACION = "";
          row.FECHARESPUESTAEPS = "";
          row.FechaVencimientoAUTORIZACION = "";
        } else {
          errors.push(
            `El número de Numero_Preautorizacion no es igual a ningun concepto del Segundo proceso :  ${
              row.NUMERO_PREAUTORIZACION || null
            }`
          );
        }
        // Si no coincide con los casos específicos, N de Autorización debe ser alfanumérico
        if (estadoProceso1 !== 2) {
          errors.push(
            `El valor del campo Numero_Preautorizacion no se encuentra en los conceptos definidos Primer proceso: ${
              row.NUMERO_PREAUTORIZACION || null
            }`
          );
        }
      }
    }

    if (
      !regexPatterns.alfanumericos.test(row.NDEAUTORIZACION) &&
      estadoProceso1 !== 2
    ) {
      errors.push(
        `Valor no válido en N DE AUTORIZACION: ${row.NDEAUTORIZACION || null}`
      );
    }
    if (
      !regexPatterns.fecha.test(row.FECHARESPUESTAEPS) &&
      estadoProceso1 !== 2
    ) {
      errors.push(
        `Valor no válido en FECHA RESPUESTA EPS: ${
          row.FECHARESPUESTAEPS || null
        }`
      );
    }
    if (
      !regexPatterns.fecha.test(row.FechaVencimientoAUTORIZACION) &&
      estadoProceso1 !== 2
    ) {
      errors.push(
        `Valor no válido en FECHA Vencimiento AUTORIZACION: ${
          row.FechaVencimientoAUTORIZACION || null
        }`
      );
    }
    if (
      (!regexPatterns.alfanumericos.test(row.NUMERO_PREAUTORIZACION) &&
        estadoProceso1 !== 2) ||
      row.NUMERO_PREAUTORIZACION === null ||
      row.NUMERO_PREAUTORIZACION === ""
    ) {
      errors.push(
        `Valor no válido en NUMERO_PREAUTORIZACION: ${
          row.NUMERO_PREAUTORIZACION || null
        }`
      );
    }

    if (
      regexPatterns.fecha.test(row.FECHARESPUESTAEPS) &&
      regexPatterns.fecha.test(row.FechaVencimientoAUTORIZACION) &&
      estadoProceso1 === 0
    ) {
      // Convierte las cadenas de fecha a objetos Dat
      const fecha1 = new Date(row.FechaVencimientoAUTORIZACION);
      const fecha2 = new Date(row.FECHARESPUESTAEPS);
      let diferenciaDias = 0;
      if (isNaN(fecha1.getTime()) || isNaN(fecha2.getTime())) {
        console.error("Error al convertir las cadenas a objetos Date.");
      } else {
        const diferenciaMilisegundos = fecha1.getTime() - fecha2.getTime();
        // Convierte la diferencia a días
        diferenciaDias = diferenciaMilisegundos / (1000 * 60 * 60 * 24);
      }

      if (fecha1 <= fecha2 && estadoProceso1 === 0) {
        errors.push(
          `Fecha de Vencimiento de Autorización debe ser mayor que Fecha de Respuesta EPS: ${
            row.FechaVencimientoAUTORIZACION || null
          }`
        );
      } else if (
        fecha1 > fecha2 &&
        diferenciaDias < 30 &&
        estadoProceso1 === 0
      ) {
        errors.push(
          `Fecha de Vencimiento de Autorización debe ser al menos 30 días después de la Fecha de Respuesta EPS: ${
            row.FechaVencimientoAUTORIZACION || null
          }`
        );
      }
    }
    // else{
    //   console.log('row.FECHARESPUESTAEPS',row.FECHARESPUESTAEPS);
    //   console.log('row.FechaVencimientoAUTORIZACION',row.FechaVencimientoAUTORIZACION);
    //   errors.push(
    //     `Fechas no tienen el formato correcto, verifique!!!`
    //   );
    // }

    return errors;
  }

  // Función para validar si un valor está en el enum Estado
  isValidEstado(value: string): boolean {
    return Object.values(EnumObservacionesAprobadas).includes(
      value.toUpperCase() as EnumObservacionesAprobadas
    );
  }

  // Función para validar si un valor está en el enum Estado
  isValidEstadoPreautorizacion(
    value: string,
    rowsConceptos: any,
    proceso: any
  ): boolean {
    return rowsConceptos.some(
      (row: any) =>
        row.concepto.toUpperCase() === value.toUpperCase() &&
        row.proceso === proceso
    );
  }

  public async listEstudiosMedicos(req: Request, res: Response) {
    try {
      pool.query(sqlQuery, (err: any, rows: any) => {
        if (err) throw err;
        try {
          pool.query(sqlQueryConceptos, (err: any, rowsConceptos: any) => {
            if (err) throw err;

            const { validRows, errorsPrimerProceso } = this.processRows(
              rows,
              rowsConceptos
            );
            const datosValid: any = [];
            validRows.forEach((row: any) => {
              if (row.FECHARESPUESTAEPS && row.FechaVencimientoAUTORIZACION) {
                row.FECHARESPUESTAEPS = this.convertDateFechaAnoMesDiaHora(
                  row.FECHARESPUESTAEPS
                );
                row.FechaVencimientoAUTORIZACION =
                  this.convertDateFechaAnoMesDiaHora(
                    row.FechaVencimientoAUTORIZACION
                  );
              }
              datosValid.push(row);
            });
           return res.status(200).json({ datosValid });
          });
        } catch (error) {
          console.error(
            "Error al obtener los conceptos de la base de datos:",
            error
          );
          res
            .status(500)
            .json({ error: `Error al obtener los conceptos. ${error}` });
        }
      });
    } catch (error) {
      console.error("Error al obtener los estudios médicos:", error);
      res
        .status(500)
        .json({ error: `Error al obtener los estudios médicos. ${error}` });
    }
  }

  convertDateFechaAnoMesDiaHora(isoDate: string): string {
    const date = new Date(isoDate);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Los meses empiezan desde 0
    const day = date.getDate().toString().padStart(2, "0");

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  public async listEstudiosMedicosExcel(req: Request, res: Response) {
    try {
      pool.query(sqlQuery, (err: any, rows: any) => {
        if (err) throw err;
        try {
          pool.query(sqlQueryConceptos, (err: any, rowsConceptos: any) => {
            if (err) throw err;

            const { validRows, errorsPrimerProceso } = this.processRows(
              rows,
              rowsConceptos
            );
            const datosValid: any = [];
            validRows.forEach((row: any) => {
              if (row.FECHARESPUESTAEPS && row.FechaVencimientoAUTORIZACION) {
                row.FECHARESPUESTAEPS = this.convertDateFechaAnoMesDiaHora(
                  row.FECHARESPUESTAEPS
                );
                row.FechaVencimientoAUTORIZACION =
                  this.convertDateFechaAnoMesDiaHora(
                    row.FechaVencimientoAUTORIZACION
                  );
              }
              datosValid.push(row);
            });

            const datosError = errorsPrimerProceso.map((item: any) => {
              // Combinar los datos de row con los errores
              return {
                Numeroactualdelaprestacion: item.row.Numeroactualdelaprestacion,
                NDEAUTORIZACION: item.row.NDEAUTORIZACION,
                FECHARESPUESTAEPS: item.row.FECHARESPUESTAEPS,
                FechaVencimientoAUTORIZACION: item.row.FechaVencimientoAUTORIZACION,
                NUMERO_PREAUTORIZACION: item.row.NUMERO_PREAUTORIZACION,
                ERRORES: item.errors.join(", ") // Convertir el array de errores en una cadena
              };
            });

            const queryAsync = promisify(pool.query).bind(pool);
            const updateRecords = async () => {
              try {
                const ids = validRows.map((row: any) => row.Numeroactualdelaprestacion);
            
                // Verificar si hay IDs válidos
                if (ids.length > 0) {
                  const placeholders = ids.map(() => '?').join(',');
            
                  const updateQuery = `
                    UPDATE bas_aut_ambulatoria 
                    SET estado = 1 
                    WHERE \`Número actual de la prestación\` IN (${placeholders});
                  `;
            
                  const results = await queryAsync(updateQuery, ids);
                  console.log(`Se actualizaron ${results.affectedRows} registros.`);
                } else {
                  console.log("No hay registros válidos para actualizar.");
                }
              } catch (err) {
                console.error("Error actualizando registros:", err);
              }
            };

            updateRecords();

            // Crear un libro de trabajo de Excel
            const wb = XLSX.utils.book_new();

            // Agregar la hoja con los datos válidos
            const wsValidRows = XLSX.utils.json_to_sheet(datosValid);
            XLSX.utils.book_append_sheet(wb, wsValidRows, "Registros validos");

            // Agregar la hoja con los datos con error (si los hay)
            if (datosError.length > 0) {
              const wsErrors = XLSX.utils.json_to_sheet(datosError);
              XLSX.utils.book_append_sheet(wb, wsErrors, "Registros Error");
            }

            // Generar el archivo Excel en formato buffer
            const excelBuffer = XLSX.write(wb, {
              type: "buffer",
              bookType: "xlsx",
            });

            // Configurar la respuesta para enviar el archivo Excel
            const currentDate = new Date().toISOString().split("T")[0];
            const filename = `Autorizaciones_${currentDate}.xlsx`;
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${filename}"`
            );
            res.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.send(excelBuffer);
          });
        } catch (error) {
          console.error(
            "Error al obtener los conceptos de la base de datos:",
            error
          );
          res
            .status(500)
            .json({ error: `Error al obtener los conceptos. ${error}` });
        }
      });
    } catch (error) {
      console.error("Error al obtener los estudios médicos:", error);
      res
        .status(500)
        .json({ error: `Error al obtener los estudios médicos. ${error}` });
    }
  }

  // Listar data completa pero con errores
  public async listEstudiosMedicosError(req: Request, res: Response) {
    try {
      pool.query(sqlQuery, (err: any, rows: any) => {
        if (err) throw err;
        try {
          pool.query(sqlQueryConceptos, (err: any, rowsConceptos: any) => {
            if (err) throw err;

            const { validRows, errorsPrimerProceso } = this.processRows(
              rows,
              rowsConceptos
            );
            const datosError: any = [];
            errorsPrimerProceso.forEach((row: any) => {
              // row.row.FECHARESPUESTAEPS = this.convertDateFechaAnoMesDiaHora(
              //   row.row.FECHARESPUESTAEPS
              // );
              // row.row.FechaVencimientoAUTORIZACION =
              //   this.convertDateFechaAnoMesDiaHora(
              //     row.row.FechaVencimientoAUTORIZACION
              //   );
              datosError.push(row.row);
            });

            return res.status(200).json({ errorsPrimerProceso });
          });
        } catch (error) {
          console.error(
            "Error al obtener los conceptos de la base de datos:",
            error
          );
          res
            .status(500)
            .json({ error: `Error al obtener los conceptos. ${error}` });
        }
      });
    } catch (error) {
      console.error("Error al obtener los estudios médicos:", error);
      res
        .status(500)
        .json({ error: `Error al obtener los estudios médicos. ${error}` });
    }
  }

  public processRows(rows: any[], rowsConceptos: any[]) {
    const validRows: any = [];
    const errorsPrimerProceso: any = [];
    rows.forEach((row: any) => {
      const errors = this.validateRow(row, rowsConceptos);
      if (errors.length > 0) {
        errorsPrimerProceso.push({ row, errors: errors });
      } else {
        validRows.push(row);
      }
    });
    return { validRows, errorsPrimerProceso };
  }

  //Listar los conceptos registrados en base de datos
  public async listConceptos(req: Request, res: Response) {
    try {
      pool.query(sqlQueryConceptos, (err: any, rows: any) => {
        if (err) throw err;
        return res.status(200).json({ conceptos: rows });
      });
    } catch (error) {
      console.error(
        "Error al obtener los conceptos de la base de datos:",
        error
      );
      res
        .status(500)
        .json({ error: `Error al obtener los conceptos. ${error}` });
    }
  }
}

export const estudiosMedicosController = new EstudiosMedicosController();
