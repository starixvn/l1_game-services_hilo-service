import { Core } from 'sc-game-base';
import { helpers } from 'sc-common';

export default class PlaceBetConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    validateBetRequest(player, amount) {
        const runningRound = this.gameData.runningRounds[player.UID];
        if (!!runningRound) {
            return { errorCode: helpers.noticeHelper.invalidBet };
        }

        const configs = this.gameData.gameConfigs;
        if (!configs.enabled) {
            return { errorCode: helpers.noticeHelper.invalidBet };
        }

        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);

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

    consume(player, payload) {
        const isValid = payload && payload.amount;
        if (!isValid) {
            return;
        }

        const failedCriterion = this.validateBetRequest(player, payload.amount);
        if (!!failedCriterion) {
            this.publisher.publishToUser(player.UID, { endBet: -1, ...failedCriterion });
            return;
        }

        const name = player.profile.name;
        const inGameInfo = this.gameData.ingame[name] ?? {
            name: player.profile.name,
            currency: player.session.currencyName,
            system: player.session.system,
            partnerId: player.session.partnerId,
            betQueue: [],
        };

        if (inGameInfo.betQueue.length === 0) {
            inGameInfo.betQueue = [{ player, payload }];
        }

        this.gameData.ingame[name] = inGameInfo;
    }
}
