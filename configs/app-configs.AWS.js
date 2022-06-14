export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://l1_game_api_AWS:5000",
        authUrl: "http://l1_auth_api_AWS:5000",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        placeBetTimeout: 4500,
        requestTimeout: 10000,
        enabledApiLogs: true,
    },
    userServiceSettings: {
        url: "http://localhost:8004/api",
        requestTimeout: 10000,
    },
    socketOptions: {
        pingInterval: 60 * 1000,
        pingTimeout: 60 * 1000,
        transports: ["websocket"],
        allowUpgrades: false,
        perMessageDeflate: false,
    },
    enabledLogs: true,
    database: {
        url: "mongodb://lmn_backend:Sb%7B5r%40Xy4X%256%28%24%5Bt%252HsOxJ%7CQt9jdR%26t@10.99.99.56:27101/?replicaSet=L1_SabaAWS",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "http://58fc00e79ab34a3bab04a79038760cb8@10.99.99.187:803/8",
        logIdentifier: "hilo",
        env: "AWS",
    },
    authenticateSettings: {
        audiences: ["api", "admin-api"],
    },
    adminSecretKey: "asWDEer4yGdgsdqR4uqmKQZgh",
    enableCorsWs: true,
    corsUrls: ["https://sc1-games.sportsfun.app", "https://sc1-adm.sportsfun.app"],
    enableMsgpackParser: false,
};
