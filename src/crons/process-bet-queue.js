import { Table } from 'sc-game-base';
import gameSettings from '../game-settings';
import cardHelper from '../helpers/card-helper';

export default class ProcessBetQueue extends Table.Crons.TableProcessBetQueue {
    constructor({
        definition,
        gameData,
        placeBetPublisher,
        placeBet,
        logService,
        betsRepository,
        betLogsRepository,
        userInfosRepository,
        baseMetrics,
        roundsRepository,
    }) {
        super({
            definition,
            gameData,
            placeBetPublisher,
            placeBet,
            logService,
            betsRepository,
            betLogsRepository,
            userInfosRepository,
            baseMetrics,
        });

        this.roundsRepository = roundsRepository;
    }

    async proceedBet(player, payload) {
        const lastRound = await this.roundsRepository
            .findOne({}, 'id', { sort: { id: -1 } })
            .lean()
            .exec();

        Object.assign(payload, {
            amount: payload.amount >> 0,
            roundId: lastRound.id + 1,
            freeBet: payload.freeBet ?? false,
            receivedTime: new Date(),
            betChoice: gameSettings.newGameChoice,
        });

        await super.proceedBet(player, payload);
    }

    async composeValidationCriteria(player, payload) {
        return (await this.composeBalanceValidationCriteria(player, payload)) || [];
    }

    decreaseBetTracks() {}
    adjustTotalBets() {}

    async handleSuccessBet(player, balance, roundId, bet) {
        await this.createNewRound(player, bet);
        await super.handleSuccessBet(player, balance, roundId, bet);
    }

    generatePlacingBetResult(player, balance, bet, rate) {
        const ownBet = super.generatePlacingBetResult(player, balance, bet, rate);
        ownBet.cards = this.gameData.runningRounds[player.UID].cards;

        const previousCard = ownBet.cards[ownBet.cards.length - 1];
        ownBet.odds = cardHelper.calculateOdd(this.gameData.gameConfigs.odds, previousCard.card, 1);

        return ownBet;
    }

    async createNewRound(player, payload) {
        const firstCard = cardHelper.drawCard([]);
        const { exchangeRates } = this.gameData;

        const newRound = {
            id: payload.roundId,
            uid: player.UID,
            name: player.profile.name,

            roundStartTime: new Date(),
            subRoundTime: new Date(),

            ended: false,
            origStake: payload.amount,
            stake: payload.amount,
            betWin: 0,
            stepCount: 0,

            cards: [firstCard],
            result: [],
            settlementResult: [],

            exchangeRateId: exchangeRates.exId,
        };

        await this.roundsRepository.create(newRound);
        this.gameData.runningRounds[player.UID] = newRound;

        return newRound;
    }
}
