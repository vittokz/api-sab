import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import cron from "node-cron";
const pool = require("./database");
import indexRoutes from "./routes/indexRoutes";
import authRoutes from "./routes/authRoutes";
import estudiosMedicosRoutes from "./routes/estudiosMedicosRoutes";

class Server {
  public app: Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
  }

  config(): void {
    this.app.set("port", process.env.PORT || 3000);
    this.app.use(morgan("dev"));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  routes(): void {
    this.app.use("/", indexRoutes);
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/data", estudiosMedicosRoutes);
  }

  start(): void {
    this.app.listen(this.app.get("port"), () => {
      console.log("Servidor desde " + this.app.get("port"));
    });
    // Ejecutar tarea cada hora
    // cron.schedule("*/15 * * * * *", () => {
    //   console.log("Ejecutando tarea...");
    //   this.listEstudiosMedicos();
    // });
  }

  async listEstudiosMedicos() {
    try {
      const rows = await this.consultarBaseDatos();
      const array = this.validarEstudiosMedicos(rows);
      
      if (array && typeof array === 'object' && 'validRows' in array && 'errors' in array) 
        {
        console.log("campos correctos: ", array);
      }
    } catch (error) {
      console.error("Error al obtener los estudios médicos:", error);
    }
  }

  async consultarBaseDatos(): Promise<any> {
    const sql =
      "SELECT Numeroactualdelaprestacion,NDEAUTORIZACION,FECHARESPUESTAEPS,FechaVencimientoAUTORIZACION,NUMERO_PREAUTORIZACION FROM datos WHERE estado = 0 LIMIT 5";
    return new Promise((resolve, reject) => {
      pool.query(sql, (err: any, rows: any, fields: any) => {
        if (err) {
          console.error("Error en la consulta a la base de datos:", err);
          reject(err);
        }
        resolve(rows);
      });
    });
  }

  validarEstudiosMedicos(rows: any): any {
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

    return {
      validRows: validRows,
      errors: errors,
    };
  }
}

const server = new Server();
server.start();