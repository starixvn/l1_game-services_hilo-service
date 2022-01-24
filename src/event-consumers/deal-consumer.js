import { Core } from "sc-game-base";
import { helpers } from "sc-common";
import gameSettings, { choiceNames } from "../game-settings";
import errorCodes from "../constants/error-codes";
import { cardRanks } from "../cards";

export default class DealConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    composeValidationCriteria(player, betChoice, freeBet, roundId) {
        const bettingTimeValidationCriteria = this.composeBettingTimeValidationCriteria(roundId) ?? [];
        const betChoiceValidationCriteria = this.composeBetChoiceValidationCriteria(player, betChoice) || [];

        return bettingTimeValidationCriteria.concat(betChoiceValidationCriteria);
    }

    composeBettingTimeValidationCriteria(roundId) {
        const configs = this.gameData.gameConfigs;

        return [
            {
                failure: !configs.enabled,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: !roundId,
                notice: this.getNoticeObj(errorCodes.roundNotExist),
            },
        ];
    }

    composeBetChoiceValidationCriteria(player, betChoice) {
        const runningRound = this.gameData.ingame[player.profile.name].betTracks;
        const currentCard = !!runningRound ? runningRound.result[runningRound.result.length - 1] : {};

        return [
            {
                failure: !this.definition.choices.includes(betChoice),
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: betChoice === choiceNames.l && currentCard.rank === cardRanks.two,
                notice: this.getNoticeObj(errorCodes.cannotLowerThan),
            },
            {
                failure: betChoice === choiceNames.h && currentCard.rank === cardRanks.ace,
                notice: this.getNoticeObj(errorCodes.cannotGreaterThan),
            },
        ];
    }

    validateBetRequest(player, betChoice, freeBet, roundId) {
        const criteria = this.composeValidationCriteria(player, betChoice, freeBet, roundId);
        const failedCriterion = criteria.find((criterion) => criterion.failure);
        if (failedCriterion) {
            this.publisher.publishToUser(player.UID, { endBet: -1, betChoice, notice: failedCriterion.notice });

            return false;
        }

        return true;
    }

    consume(player, payload) {
        if (!this.gameData.ingame[player.profile.name]?.betTracks) {
            this.publisher.publishToUser(player.UID, { endBet: -1, notice: this.getNoticeObj(helpers.noticeHelper.invalidBet) });
            return;
        }

        const runningRound = this.gameData.ingame[player.profile.name].betTracks;

        Object.assign(payload, {
            freeBet: payload.freeBet ?? false,
            roundId: payload.roundId ?? runningRound.id,
            order: runningRound.totalTurns,
            receivedTime: new Date(),
        });

        const { betChoice, freeBet, roundId } = payload;

        if (!this.validateBetRequest(player, betChoice, freeBet, roundId)) {
            return;
        }

        this.gameData.ingame[player.profile.name].betQueue = this.gameData.ingame[player.profile.name].betQueue ?? [];
        this.gameData.ingame[player.profile.name].betQueue.push({ player, payload: { action: gameSettings.actions.deal, bet: payload } });
    }
}
