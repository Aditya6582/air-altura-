const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

module.exports = {
    PORT: process.env.PORT
}

