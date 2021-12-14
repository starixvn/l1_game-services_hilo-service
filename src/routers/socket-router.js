import { Core } from 'sc-game-base';
import { helpers } from 'sc-common';
import gameSettings from '../game-settings';

export default class SocketRouter extends Core.Routers.BaseSocketRouter {
    init(socketClient) {
        super.init(socketClient);

        this.socketClient = socketClient;
        this.socketClient.on('newGame', this.handleNewGame.bind(this));
        this.socketClient.on('anNon', this.handleAnNon.bind(this));
    }

    async handleNewGame(payload) {
        try {
            const isValid = this.verify() && payload && payload.amount;
            if (!isValid) {
                return;
            }

            const player = this.gameData.realPlayers[this.socketClient.id];
            const failedCriterion = this.validateNewGame(player, payload.amount);
            if (!!failedCriterion) {
                this.socketClient.emit({ endBet: -1, ...failedCriterion });
                return;
            }

            const name = player.profile.name;
            if (this.gameData.ingame[name]) {
                return;
            }

            this.gameData.ingame[name] = {
                name: player.profile.name,
                currency: player.session.currencyName,
                system: player.session.system,
                partnerId: player.session.partnerId,
                betQueue: [{ player, payload }],
            };
        } catch (error) {
            this.logService.logError(error);
        }
    }

    handleAnNon() {
        try {
            if (!this.verify()) {
                return;
            }

            const player = this.gameData.realPlayers[this.socketClient.id];
            const runningRound = this.gameData.runningRounds[player.UID];
            const failedCriterion = this.validateAnNon(runningRound);
            if (!!failedCriterion) {
                this.socketClient.emit({ isAnNon: false, ...failedCriterion });
                return;
            }

            runningRound.anNon = true;
        } catch (error) {
            this.logService.logError(error);
        }
    }

    validateNewGame(player, amount) {
        const configs = this.gameData.gameConfigs;
        if (!configs.enabled) {
            return { errorCode: helpers.noticeHelper.invalidBet };
        }

        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);

        const maxBetPerChoice = Math.min(player.profile.maxBet, settings.maxBetPerChoices[gameSettings.newGameChoice]);
        if (maxBetPerChoice < amount) {
            return { errorCode: helpers.noticeHelper.maxBetForChoice, maxBet: maxBetPerChoice };
        }

        const minBet = Math.max(player.profile.minBet, settings.minBet);
        if (amount < minBet) {
            return { errorCode: helpers.noticeHelper.minBet, minBet };
        }

        const maxBet = Math.min(player.profile.maxBet, settings.maxBet);
        if (maxBet < amount) {
            return { errorCode: helpers.noticeHelper.maxBet, maxBet };
        }

        return null;
    }

    validateAnNon(runningRound) {
        if (!runningRound) {
            return { notice: 'Phiên chơi đã kết thúc...' };
        }

        if (runningRound.stepCount === 0) {
            return { notice: 'Chưa đủ điều kiện ăn non...' };
        }

        return null;
    }
}
