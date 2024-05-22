
import keys from "./keys";
const mysql = require('mysql');

const dbConfig = {
  host: keys.database.host,
  user: keys.database.user,
  password: keys.database.password,
  database: keys.database.database,
};

const pool = mysql.createPool(dbConfig);

pool.getConnection((err: any, connection: any) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos');
    connection.release();
  }
});

module.exports = pool;