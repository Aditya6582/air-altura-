require('dotenv').config();

const config = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 3306,
    dialect:  process.env.DB_DIALECT || 'mysql',
    logging:  false,
};

module.exports = { development: config, production: config };
