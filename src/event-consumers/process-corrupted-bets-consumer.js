export default class ProcessCorruptedBetsConsumer {
    constructor(betsRepository, settleGameRoundConsumer) {
        this.betsRepository = betsRepository;
        this.settleGameRoundConsumer = settleGameRoundConsumer;
    }

    async consume() {
        const bets = await this.betsRepository.find({ thanhtoan: false }).lean().exec();
        if (!bets) {
            return;
        }

        for (let i = 0; i < bets.length; i++) {
            const bet = bets[i];
            const newInfo = {
                isWin: true,
                turnTime: new Date(),
                totalAmount: bet.totalAmount,
                totalTurns: bet.totalTurns,
                result: bet.result,
                settlementResult: bet.settlementResult,
            };

            await this.settleGameRoundConsumer.settleBets({
                result: bet,
                settlementResult: newInfo,
                roundId: bet.phien,
                time: newInfo.turnTime,
            });
        }
    }
}
