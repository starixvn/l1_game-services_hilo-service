import { Core } from 'sc-game-base';
import { helpers } from 'sc-common';
import gameSettings from '../game-settings';
import errorCodes from '../constants/error-codes';

export default class DealConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    constructor(definition, gameData, publisher, betsRepository, settleGameRoundConsumer) {
        super(definition, gameData, publisher);
        this.betsRepository = betsRepository;
        this.settleGameRoundConsumer = settleGameRoundConsumer;
    }

    async composeValidationCriteria(player, betChoice, freeBet, roundId) {
        const bettingTimeValidationCriteria = this.composeBettingTimeValidationCriteria(roundId) ?? [];
        const betAmountValidationCriteria = this.composeBetAmountValidationCriteria(freeBet) || [];
        const betChoiceValidationCriteria = this.composeBetChoiceValidationCriteria(player, betChoice) || [];

        return bettingTimeValidationCriteria.concat(betChoiceValidationCriteria, betAmountValidationCriteria);
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
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: errorCodes.roundNotExist }),
            },
        ];
    }

    composeBetAmountValidationCriteria(freeBet) {
        const configs = this.gameData.gameConfigs;

        return [
            {
                failure: freeBet && !configs.enableFreeBet,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
        ];
    }

    composeBetChoiceValidationCriteria(player, betChoice) {
        const runningRound = this.gameData.runningRounds[player.UID];
        const currentCard = !!runningRound ? runningRound.result[runningRound.result.length - 1] : {};

        return [
            {
                failure: !this.definition.choices.includes(betChoice),
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: betChoice === gameSettings.loChoice && currentCard.rank === 1,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: errorCodes.lowerThan2 }),
            },
            {
                failure: betChoice === gameSettings.hiChoice && currentCard.rank === 0,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: errorCodes.greaterThan1 }),
            },
        ];
    }

    async validateBetRequest(player, betChoice, freeBet, roundId) {
        if (!betChoice) {
            return false;
        }

        const criteria = await this.composeValidationCriteria(player, betChoice, freeBet, roundId);
        const failedCriterion = criteria.find((criterion) => criterion.failure);

        if (failedCriterion) {
            this.publisher.publishToUser(player.UID, { endBet: -1, betChoice, notice: failedCriterion.notice });

            return false;
        }

        return true;
    }

    async consume(player, payload) {
        Object.assign(payload, {
            freeBet: payload.freeBet ?? false,
            roundId: payload.roundId ?? this.gameData.runningRounds[player.UID]?.phien,
            receivedTime: new Date(),
        });

        const { betChoice, freeBet, roundId } = payload;

        console.log('Deal1');
        if (!(await this.validateBetRequest(player, betChoice, freeBet, roundId))) {
            return;
        }

        console.log('Deal2');
        const result = await this.settleGameRoundConsumer.settleTurn(player.UID, payload);
        this.publisher.publishToUser(player.UID, { endBet: 1, payload, result });
    }
}
