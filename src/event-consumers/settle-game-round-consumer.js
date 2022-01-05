import { Core } from 'sc-game-base';
import gameHelper from '../helpers/game-helper';

export default class SettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    constructor(params) {
        super(params);
        this.betLogsRepository = params.betLogsRepository;
    }

    generateResult(runningRound) {
        const resultFromAdmin = this.gameData.settlementResultFromAdmin
            ? this.gameData.settlementResultFromAdmin[runningRound.phien]
            : null;

        return resultFromAdmin ? resultFromAdmin.result : gameHelper.drawCard(runningRound.result);
    }

    calculateBetResult(settlementResult, bet) {
        const amount = bet.amount;
        const betWin = settlementResult.isWin ? settlementResult.totalAmount - bet.amount : 0;

        return {
            ...settlementResult,
            totalBetAmount: amount,
            betWin,
            netWin: settlementResult.isWin ? settlementResult.totalAmount.toFixed(2) : 0,
            totalWin: settlementResult.totalAmount.toFixed(2),
            totalLost: settlementResult.isWin ? 0 : amount,
        };
    }

    async settleTurn(playerUID, payload) {
        const runningRound = this.gameData.runningRounds[playerUID];

        const previousCard = runningRound.result[runningRound.result.length - 1];
        const nextCard = this.generateResult(runningRound);
        const isWin = gameHelper.isWin(payload.betChoice, previousCard, nextCard);

        const odds = gameHelper.calculateOdd(this.gameData.gameConfigs.odds, previousCard.rank, runningRound.totalTurns + 1);
        const newStake = isWin ? runningRound.totalAmount * (1 + odds[payload.betChoice]) : runningRound.totalAmount;

        const betWin = isWin ? newStake - runningRound.totalAmount : 0;
        await this.addBetLog(runningRound, previousCard, nextCard, payload.betChoice, betWin);
        const newInfo = {
            isWin,
            totalAmount: newStake,
            totalTurns: runningRound.totalTurns + 1,
            result: runningRound.result,
            settlementResult: runningRound.settlementResult,
            turnTime: new Date(),
            odds,
            newOdds: gameHelper.calculateOdd(this.gameData.gameConfigs.odds, nextCard.rank, runningRound.totalTurns + 2),
        };

        newInfo.result.push(nextCard);
        newInfo.settlementResult.push(gameHelper.getSettlementResult(previousCard, nextCard));
        await this.betsRepository.updateOne({ phien: runningRound.phien }, { $set: newInfo }).exec();

        const settleResult = { ...runningRound, ...newInfo };
        await this.userBetResultPublisher.publish(playerUID, settleResult);

        if (isWin) {
            Object.assign(runningRound, newInfo);
        } else {
            await this.settleBets({ runningRound, settlementResult: newInfo, roundId: runningRound.phien, time: newInfo.turnTime });
            delete this.gameData.runningRounds[playerUID];
        }

        return settleResult;
    }

    async addBetLog(runningRound, card1, card2, choice, betWin) {
        const player = Object.values(this.gameData.realPlayers).find((p) => p.UID === runningRound.uid);
        const rate = player.session.multiplier * this.gameData.exchangeRates.code[player.session.currencyCode];

        const log = {
            uid: runningRound.uid,
            name: runningRound.name,
            phien: runningRound.phien,

            time: new Date(),
            amount: runningRound.totalAmount,
            betwin: betWin,
            choice,

            memberId: player.session.memberId,
            siteId: player.session.siteId,
            partnerId: player.session.partnerId,
            currency: player.session.currencyName,
            rate: rate,

            order: runningRound.totalTurns + 1,
            cards: [card1, card2],
        };

        await this.betLogsRepository.create(log);
    }

    async settleRound() {}

    async settleBets({ result, settlementResult, roundId, time }) {
        await super.settleBets({ result, settlementResult, roundId, time });

        const bets = await this.queryBets(roundId);
        if (bets && bets.length) {
            await Promise.all(
                bets.map(async (bet) => {
                    bet.endTime = new Date();
                    await bet.save();
                })
            );
        }
    }
}
