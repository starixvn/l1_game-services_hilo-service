import { Core } from "sc-game-base";

export default class SettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    calculateBetResult(settlementResult, bet) {
        const amount = bet.amount;
        const netWin = settlementResult.isWinOrTie ? settlementResult.betwin - bet.amount : 0;

        return {
            ...settlementResult,
            totalBetAmount: amount,
            netWin,
            totalWin: settlementResult.betwin,
            totalLost: settlementResult.isWinOrTie ? 0 : amount,
        };
    }

    async settleRound() {}

    async settleBets(name) {
        const result = this.gameData.ingame[name].betTracks;
        const { turnResult: settlementResult, id: roundId } = result;
        const time = settlementResult.turnTime;
        const bets = await this.queryBets(roundId);

        if (bets && bets.length) {
            await Promise.all(
                bets.map(async (bet) => {
                    const betResult = this.calculateBetResult(settlementResult, bet);

                    bet.betwin = betResult.totalWin;
                    bet.paid = true;
                    bet.endTime = new Date();

                    await bet.save();
                    await this.callEndGame(bet, roundId, time, betResult);

                    this.captureBetResult(bet.uid, betResult, bet.rate);
                    await this.userBetResultPublisher.publish(bet.uid, betResult);
                })
            );
        }
    }

    queryBets(roundId) {
        return this.roundsRepository.find({ id: roundId }).exec();
    }
}
