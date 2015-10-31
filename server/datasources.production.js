module.exports = {
  db: {
    host: process.env.INFORMANTE_DB_HOST,
    port: process.env.INFORMANTE_DB_PORT,
    database: process.env.INFORMANTE_DB_NAME,
    username: process.env.INFORMANTE_DB_USERNAME,
    password: process.env.INFORMANTE_DB_PASSWORD,
    name: 'db',
    connector: 'mongodb'
  }
};
