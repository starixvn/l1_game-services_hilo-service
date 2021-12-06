import { Core } from 'sc-game-base';

export default class SocketRouter extends Core.Routers.BaseSocketRouter {
    init(socketClient) {
        super.init(socketClient);

        this.socketClient = socketClient;
        this.socketClient.on('play', this.handlePlay.bind(this));
        this.socketClient.on('continue', this.handleContinue.bind(this));
        this.socketClient.on('collect', this.handleCollect.bind(this));
    }

    handlePlay(payload) {
        try {
            if (!this.verify()) {
                return;
            }
        } catch (error) {
            this.logService.logError(error);
        }
    }

    handleContinue(payload) {
        try {
            if (!this.verify()) {
                return;
            }
        } catch (error) {
            this.logService.logError(error);
        }
    }

    handleCollect(payload) {
        try {
            if (!this.verify()) {
                return;
            }
        } catch (error) {
            this.logService.logError(error);
        }
    }
}
