import Chance from 'chance';
import { Table } from 'sc-game-base';

export default class GameCron extends Table.Crons.TableGameCron {
    constructor(params) {
        super(params);
        this.processCorruptedBetsConsumer = params.processCorruptedBetsConsumer;
        this.collectConsumer = params.collectConsumer;
        this.chance = new Chance();
    }

    async start() {
        await super.start();
        await this.processCorruptedBetsConsumer.consume();

        const lastRound = await this.roundsRepository
            .findOne({}, 'phien', { sort: { id: -1 } })
            .lean()
            .exec();

        this.gameData.roundId = lastRound ? lastRound.phien + 1 : await this.getLastArchiveRound();
    }

    async proceed() {
        await this.processRunningRounds();
        await super.proceed();
        await this.proceeedAutoSettlement();
    }

    async processRunningRounds() {
        const runningRounds = Object.values(this.gameData.runningRounds);
        const currentTime = new Date();

        for (let i = 0; i < runningRounds.length; i++) {
            const r = runningRounds[i];
            if (r.turnEndTime <= currentTime && r.totalTurns === 0) {
                const payload = { betChoice: this.autoChooseChoice() };
                await this.settleGameRoundConsumer.settleTurn(r.uid, payload);
            }

            if (r.turnEndTime <= currentTime && r.totalTurns > 0) {
                await this.collectConsumer.consume({ UID: r.uid });
            }
        }
    }

    autoChooseChoice() {
        const choiceIndex = this.chance.integer({ min: 0, max: 1 });
        return this.definition.choices[choiceIndex];
    }

    async proceeedAutoSettlement() {
        const now = new Date();
        await Promise.all(
            Object.values(this.gameData.ingame)
                .filter((user) => user.endTime.getTime() >= now.getTime())
                .map((user) => this.settleGameRoundConsumer.settleRound(user.name))
        );
    }

    resetForNewRound() {}
}
