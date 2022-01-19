import { Core } from "sc-game-base";
import { helpers } from "sc-common";
import gameSettings from "../game-settings";

export default class PlaceBetConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    composeValidationCriteria(player, amount) {
        const bettingTimeValidationCriteria = this.composeBettingTimeValidationCriteria(player);
        const betAmountValidationCriteria = this.composeBetAmountValidationCriteria(player, amount);

        return bettingTimeValidationCriteria.concat(betAmountValidationCriteria);
    }

    composeBettingTimeValidationCriteria(player) {
        const runningRound = this.gameData.ingame[player.profile.name]?.betTracks;
        const configs = this.gameData.gameConfigs;

        return [
            {
                failure: !!runningRound || !configs.enabled,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
        ];
    }

    composeBetAmountValidationCriteria(player, amount) {
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);
        const minBet = Math.max(player.profile.minBet, settings.minBet);
        const maxBet = Math.min(player.profile.maxBet, settings.maxBet);

        return [
            {
                failure: amount < minBet,
                notice: this.getNoticeObj(helpers.noticeHelper.minBet, { minBet }),
            },
            {
                failure: maxBet < amount,
                notice: this.getNoticeObj(helpers.noticeHelper.maxBet, { maxBet }),
            },
        ];
    }

    validateBetRequest(player, amount) {
        const criteria = this.composeValidationCriteria(player, amount);
        const failedCriterion = criteria.find((criterion) => criterion.failure);

        if (failedCriterion) {
            this.publisher.publishToUser(player.UID, { endBet: -1, notice: failedCriterion.notice });

            return false;
        }

        return true;
    }

    consume(player, payload) {
        Object.assign(payload, { amount: payload.amount >> 0, receivedTime: new Date() });

        if (!this.validateBetRequest(player, payload.amount)) {
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

        inGameInfo.betQueue.push({ player, payload: { action: gameSettings.actions.bet, bet: payload } });
        this.gameData.ingame[name] = inGameInfo;
    }
}
