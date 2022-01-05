import errorCodes from '../constants/error-codes';

export default class CollectConsumer {
    constructor(definition, gameData, publisher, settleGameRoundConsumer) {
        this.definition = definition;
        this.gameData = gameData;
        this.publisher = publisher;
        this.settleGameRoundConsumer = settleGameRoundConsumer;
    }

    validate(runningRound) {
        if (!runningRound) {
            return { notice: errorCodes.roundEnded };
        }

        if (runningRound.totalTurns === 0) {
            return { notice: errorCodes.cannotCollect };
        }

        return null;
    }

    async consume(playerUid) {
        const runningRound = this.gameData.runningRounds[playerUid];
        const failedCriterion = this.validate(runningRound);

        if (!!failedCriterion) {
            this.publisher.publishToUser(playerUid, { isCollect: false, ...failedCriterion });
            return;
        }

        const newInfo = {
            isWin: true,
            turnTime: new Date(),
            totalAmount: runningRound.totalAmount,
            totalTurns: runningRound.totalTurns,
            result: runningRound.result,
            settlementResult: runningRound.settlementResult,
        };

        await this.settleGameRoundConsumer.settleBets({
            result: runningRound,
            settlementResult: newInfo,
            roundId: runningRound.phien,
            time: newInfo.turnTime,
        });

        delete this.gameData.runningRounds[playerUid];
    }
}
