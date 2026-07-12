
const express = require('express');
const { ServerConfig, Logger, RabbitMQ } = require('./config');
const apiRoutes = require('./routes');
const subscribeSeatRestoration = require('./subscribers/seat-restoration');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use('/api', apiRoutes)

app.listen(ServerConfig.PORT, async () => {
    console.log(`Successfully started server on PORT : ${ServerConfig.PORT}`);
    Logger.info("Successfully started the server", {});

    await RabbitMQ.connectRabbitMQ();
    await subscribeSeatRestoration();
})