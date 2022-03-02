import { Core } from "sc-game-base";

export default class SettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    calculateBetResult(settlementResult, bet) {
        const amount = bet.amount;
        const netWin = settlementResult.isLose ? 0 : settlementResult.betwin - bet.amount;

        return {
            ...settlementResult,
            totalBetAmount: amount,
            netWin,
            totalWin: settlementResult.betwin,
            totalLost: settlementResult.isLose ? amount : 0,
        };
    }

    async collect(player) {
        const runningRound = this.gameData.ingame[player.profile.name]?.betTracks;
        if (!runningRound) {
            return;
        }

        const turnTime = new Date();
        runningRound.turnTime = turnTime;
        runningRound.turnResult = {
            isLose: false,
            turnTime: turnTime,
            betwin: runningRound.betwin,
            totalTurns: runningRound.totalTurns,
            result: runningRound.result,
            settlementResult: runningRound.settlementResult,
        };

        await this.settleBets(runningRound.name);
    }

    async settleBets(name) {
        const result = this.gameData.ingame[name].betTracks;
        const { turnResult: settlementResult, id: roundId } = result;
        const time = settlementResult.turnTime;
        const bets = await this.queryBets(roundId);

        if (bets?.length) {
            await Promise.all(
                bets.map(async (bet) => {
                    const betResult = this.calculateBetResult(settlementResult, bet);

                    bet.betwin = betResult.totalWin;
                    bet.paid = true;
                    bet.endTime = new Date();

                    await bet.save();
                    await this.callEndGame(bet, roundId, time, betResult);
                    await this.userBetResultPublisher.publish(bet.uid, betResult);
                })
            );
        }

        delete this.gameData.settlementResultFromAdmin[name];
        delete this.gameData.ingame[name].betTracks;
    }

    queryBets(roundId) {
        return this.roundsRepository.find({ id: roundId }).exec();
    }
}
