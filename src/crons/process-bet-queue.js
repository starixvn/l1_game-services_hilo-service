import { Table } from 'sc-game-base';
import deckHelper from '../helpers/deck-helper';
import oddsGenerator from '../generators/odds-generator';
import gameSettings from '../game-settings';

export default class ProcessBetQueue extends Table.Crons.TableProcessBetQueue {
    constructor(params) {
        super(params);

        this.settleGameRoundConsumer = params.settleGameRoundConsumer;
    }

    async bet(player, payload) {
        Object.assign(payload, {
            amount: payload.amount >> 0,
            roundId: this.gameData.roundId,
            freeBet: payload.freeBet ?? false,
            receivedTime: new Date(),
        });

        await super.proceedBet(player, payload);
    }

    async collect(player) {
        const runningRound = this.gameData.ingame[player.profile.name]?.betTracks;
        if (!runningRound) {
            return;
        }

        const turnTime = new Date();
        runningRound.turnTime = turnTime;
        runningRound.settlementBetResult = {
            isWin: true,
            turnTime: turnTime,
            turnEndTime: new Date(turnTime.getTime() + gameSettings.turnTime * 1000),
            betwin: runningRound.betwin,
            totalTurns: runningRound.totalTurns,
            result: runningRound.result,
            settlementResult: runningRound.settlementResult,
        };

        await this.settleGameRoundConsumer.settleBets(runningRound.name);
        delete this.gameData.settlementResultFromAdmin[runningRound.name];
        delete this.gameData.ingame[player.profile.name].betTracks;
    }

    async deal(player, bet) {
        const runningRound = this.gameData.ingame[player.profile.name]?.betTracks;
        if (!!runningRound && runningRound.totalTurns === bet.order) {
            const result = await this.settleGameRoundConsumer.settleTurn({ uid: runningRound.UID, name: player.profile.name }, bet);
            const payload = {
                roundId: result.id,
                betwin: result.betwin,
                settlementResult: result.settlementResult,
                turnTime: result.turnTime,
                nextAmounts: result.nextAmounts,
            };

            this.placeBetPublisher.publishToUser(player.UID, { endBet: 1, bet, payload });
        }
    }

    async proceedBet(player, payload) {
        switch (payload.action) {
            case gameSettings.actions.bet:
                await this.bet(player, payload.bet);
                break;
            case gameSettings.actions.collect:
                await this.collect(player);
                break;
            case gameSettings.actions.deal:
                await this.deal(player, payload.bet);
                break;
        }
    }

    async composeValidationCriteria(player, payload) {
        return (await this.composeBalanceValidationCriteria(player, payload)) || [];
    }

    decreaseBetTracks() {}
    adjustTotalBets() {}

    async upsertBet(player, roundId, bet, rate) {
        const firstCard = this.generateFirstCard(player.profile.name);
        const { exchangeRates } = this.gameData;

        const turnTime = new Date();
        const newBet = {
            uid: player.UID,
            name: player.profile.name,
            id: roundId,
            amount: bet.amount,

            time: turnTime,
            odds: this.gameData.gameConfigs.odds,
            rate,
            betwin: bet.amount,
            result: [firstCard],
            settlementResult: [],
            exchangeRateId: exchangeRates.exId,

            totalTurns: 0,
            turnTime: turnTime,
            turnEndTime: new Date(turnTime.getTime() + gameSettings.turnTime * 1000),
        };

        const existingBetFilter = { uid: player.UID, id: roundId, freeBet: bet.freeBet };

        if (player.session) {
            newBet.memberId = player.session.memberId;
            newBet.siteId = player.session.siteId;
            newBet.partnerId = player.session.partnerId;
            newBet.currency = player.session.currencyName;
        }

        await this.betsRepository.updateOne(existingBetFilter, { $setOnInsert: newBet }, { upsert: true, setDefaultsOnInsert: true });

        const odds = oddsGenerator.generate(this.gameData.gameConfigs.odds, firstCard.rank, 1);
        newBet.nextAmounts = {
            [gameSettings.hiChoice]: (1 + odds[gameSettings.hiChoice]) * newBet.betwin,
            [gameSettings.loChoice]: (1 + odds[gameSettings.loChoice]) * newBet.betwin,
        };

        this.gameData.ingame[player.profile.name].betTracks = newBet;
        this.gameData.roundId++;
    }

    async insertBetLog() {}

    generateFirstCard(name) {
        const resultFromAdmin = this.gameData.settlementResultFromAdmin ? this.gameData.settlementResultFromAdmin[name] : null;

        return !!resultFromAdmin && resultFromAdmin.length > 0 ? resultFromAdmin[0] : deckHelper.drawCard([]);
    }

    generatePlacingBetResult(player, balance, bet, rate) {
        const { amount } = bet;
        const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: {} };

        return {
            endBet: amount,
            ownBets: {
                roundId: betTracks.id,
                result: betTracks.result,
                nextAmounts: betTracks.nextAmounts,
            },
            user: { ...balance },
        };
    }
}
