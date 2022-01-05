import { Table } from 'sc-game-base';
import gameHelper from '../helpers/game-helper';

export default class ProcessBetQueue extends Table.Crons.TableProcessBetQueue {
    async proceedBet(player, payload) {
        const lastRound = (await this.betsRepository
            .findOne({}, 'phien', { sort: { id: -1 } })
            .lean()
            .exec()) ?? { phien: 0 };

        Object.assign(payload, {
            amount: payload.amount >> 0,
            roundId: lastRound.phien + 1,
            freeBet: payload.freeBet ?? false,
            receivedTime: new Date(),
        });

        await super.proceedBet(player, payload);
    }

    async composeValidationCriteria(player, payload) {
        return (await this.composeBalanceValidationCriteria(player, payload)) || [];
    }

    decreaseBetTracks() {}
    adjustTotalBets() {}

    async upsertBet(player, roundId, bet, rate) {
        const firstCard = gameHelper.drawCard([]);
        const { exchangeRates } = this.gameData;

        const newBet = {
            uid: player.UID,
            name: player.profile.name,
            phien: roundId,
            amount: bet.amount,

            time: new Date(),
            odds: this.gameData.gameConfigs.odds,
            rate,
            totalAmount: bet.amount,
            result: [firstCard],
            settlementResult: [],
            exchangeRateId: exchangeRates.exId,

            totalTurns: 0,
            turnTime: new Date(),
        };

        const existingBetFilter = { uid: player.UID, phien: roundId, freeBet: bet.freeBet };

        if (player.session) {
            newBet.memberId = player.session.memberId;
            newBet.siteId = player.session.siteId;
            newBet.partnerId = player.session.partnerId;
            newBet.currency = player.session.currencyName;
        }

        await this.betsRepository.updateOne(existingBetFilter, { $setOnInsert: newBet }, { upsert: true, setDefaultsOnInsert: true });

        newBet.odds = gameHelper.calculateOdd(this.gameData.gameConfigs.odds, firstCard.rank, 1);
        this.gameData.runningRounds[player.UID] = newBet;
    }

    async insertBetLog() {}

    generatePlacingBetResult(player, balance, bet, rate) {
        const ownBet = super.generatePlacingBetResult(player, balance, bet, rate);
        ownBet.runningRound = this.gameData.runningRounds[player.UID];

        return ownBet;
    }
}
