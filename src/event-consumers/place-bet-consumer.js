import { Core } from 'sc-game-base';
import { helpers } from 'sc-common';
import gameSettings from '../game-settings';

export default class PlaceBetConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    constructor(definition, gameData, publisher, roundsRepository, settleGameRoundConsumer) {
        super(definition, gameData, publisher);
        this.roundsRepository = roundsRepository;
        this.settleGameRoundConsumer = settleGameRoundConsumer;
    }

    async composeValidationCriteria(player, betChoice, amount, freeBet, roundId) {
        const bettingTimeValidationCriteria = (await this.composeBettingTimeValidationCriteria(roundId)) ?? [];
        const betAmountValidationCriteria = this.composeBetAmountValidationCriteria(player, betChoice, amount, freeBet) || [];
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

    composeBetAmountValidationCriteria(player, betChoice, amount, freeBet) {
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);
        const configs = this.gameData.gameConfigs;
        const minBet = Math.max(player.profile.minBet, settings.minBet);
        const maxBet = Math.min(player.profile.maxBet, settings.maxBet);
        const maxBetPerChoice = Math.min(player.profile.maxBet, settings.maxBetPerChoices[betChoice]);

        return [
            {
                failure: freeBet && !configs.enableFreeBet,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: amount > maxBetPerChoice,
                notice: this.getNoticeObj(helpers.noticeHelper.maxBetForChoice, { maxBet: maxBetPerChoice }),
            },
            {
                failure: amount < minBet,
                notice: this.getNoticeObj(helpers.noticeHelper.minBet, { minBet }),
            },
            {
                failure: amount > maxBet,
                notice: this.getNoticeObj(helpers.noticeHelper.maxBet, { maxBet }),
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

        const criteria = await this.composeValidationCriteria(player, betChoice, amount, freeBet, roundId);
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

        const result = await this.settleGameRoundConsumer.settleSubRound(player, payload);
        this.publisher.publishToUser(player.UID, { endBet: 1, payload, result });
    }
}
