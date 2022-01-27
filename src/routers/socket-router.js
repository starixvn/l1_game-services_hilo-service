import { Core } from "sc-game-base";

export default class SocketRouter extends Core.Routers.BaseSocketRouter {
    constructor({
        definition,
        gameData,
        userSignInConsumer,
        inGameConsumer,
        placeBetConsumer,
        userDisconnectConsumer,
        userSignInPublisher,
        historyQuery,
        logService,
        playGamePermissionValidator,
        dealConsumer,
        collectConsumer,
    }) {
        super({
            definition,
            gameData,
            userSignInConsumer,
            inGameConsumer,
            placeBetConsumer,
            userDisconnectConsumer,
            userSignInPublisher,
            historyQuery,
            logService,
            playGamePermissionValidator,
        });

        this.dealConsumer = dealConsumer;
        this.collectConsumer = collectConsumer;
    }

    init(socketClient) {
        super.init(socketClient);

        this.socketClient = socketClient;
        this.socketClient.on("deal", this.handleDeal.bind(this));
        this.socketClient.on("collect", this.handleCollect.bind(this));
    }

    async handleDeal(payload) {
        try {
            if (!this.verify()) {
                return;
            }

            const player = this.gameData.realPlayers[this.socketClient.id];
            await this.dealConsumer.consume(player, payload);
        } catch (error) {
            this.logService.logError(error);
        }
    }

    async handleCollect() {
        try {
            if (!this.verify()) {
                return;
            }

            const player = this.gameData.realPlayers[this.socketClient.id];
            await this.collectConsumer.consume(player);
        } catch (error) {
            this.logService.logError(error);
        }
    }
}
