import { Core } from 'sc-game-base';
import { helpers } from 'sc-common';
import gameSettings from '../game-settings';

export default class PlaceBetConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    constructor(definition, gameData, publisher, roundsRepository, settleGameRoundConsumer) {
        super(definition, gameData, publisher);
        this.roundsRepository = roundsRepository;
        this.settleGameRoundConsumer = settleGameRoundConsumer;
    }

    async composeValidationCriteria(player, betChoice, freeBet, roundId) {
        const bettingTimeValidationCriteria = (await this.composeBettingTimeValidationCriteria(roundId)) ?? [];
        const betAmountValidationCriteria = this.composeBetAmountValidationCriteria(freeBet) || [];
        const betChoiceValidationCriteria = this.composeBetChoiceValidationCriteria(player, betChoice) || [];

        return bettingTimeValidationCriteria.concat(betChoiceValidationCriteria, betAmountValidationCriteria);
    }

    async composeBettingTimeValidationCriteria(roundId) {
        const configs = this.gameData.gameConfigs;
        const round = roundId ? await this.roundsRepository.findOne({ id: roundId }).lean().exec() : {};

        return [
            {
                failure: !configs.enabled,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: !roundId,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: 'Phiên chơi đã kết thúc...' }),
            },
            {
                failure: roundId && !round,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: 'Phiên không tồn tại...' }),
            },
            {
                failure: round && round.ended,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: 'Phiên đã kết thúc...' }),
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
        const currentCard = !!runningRound ? runningRound.cards[runningRound.cards.length - 1] : {};

        return [
            {
                failure: !this.definition.choices.includes(betChoice),
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: betChoice === gameSettings.loChoice && currentCard.card === 1,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: 'Không thể chọn thấp hơn 2' }),
            },
            {
                failure: betChoice === gameSettings.hiChoice && currentCard.card === 0,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { message: 'Không thể chọn cao hơn A' }),
            },
        ];
    }

    async validateBetRequest(player, betChoice, amount, freeBet, roundId) {
        if (!amount || !betChoice) {
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
            amount: payload.amount >> 0,
            freeBet: payload.freeBet ?? false,
            roundId: payload.roundId ?? this.gameData.runningRounds[player.UID]?.id,
            receivedTime: new Date(),
        });

        const { amount, betChoice, freeBet, roundId } = payload;

        if (!(await this.validateBetRequest(player, betChoice, amount, freeBet, roundId))) {
            return;
        }

        const result = await this.settleGameRoundConsumer.settleSubRound(player.UID, payload);
        this.publisher.publishToUser(player.UID, { endBet: 1, payload, result });
    }
}
