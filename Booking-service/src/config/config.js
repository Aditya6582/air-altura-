const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
    development: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host:     process.env.DB_HOST,
        port:     parseInt(process.env.DB_PORT) || 3306,
        dialect:  process.env.DB_DIALECT || 'mysql',
        logging:  false,
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host:     process.env.DB_HOST,
        port:     parseInt(process.env.DB_PORT) || 3306,
        dialect:  process.env.DB_DIALECT || 'mysql',
        logging:  false,
    },
};
