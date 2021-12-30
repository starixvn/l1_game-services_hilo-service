import { Table } from 'sc-game-base';
import { Random as RandomJS, MersenneTwister19937 } from 'random-js';
import gameHelper from '../helpers/game-helper';

export default class GameCron extends Table.Crons.TableGameCron {
    async proceed() {
        await this.processRunningRounds();
        await super.proceed();
    }

    async processRunningRounds() {
        const runningRounds = Object.values(this.gameData.runningRounds);
        for (let i = 0; i < runningRounds.length; i++) {
            const r = runningRounds[i];
            const isExpired = gameHelper.isExpiredRound(r.subRoundTime, this.definition.durations.wholeRound);

            if (r.anNon || (isExpired && r.stepCount > 0)) {
                await this.settleGameRoundConsumer.anNon(r.uid);
                continue;
            }

            if (isExpired && r.stepCount === 0) {
                const payload = { betChoice: this.autoChooseChoice() };
                await this.settleGameRoundConsumer.settleSubRound(r.uid, payload);
            }
        }
    }

    autoChooseChoice() {
        const random5 = new RandomJS(MersenneTwister19937.autoSeed());
        const choiceIndex = random5.integer(0, 1);

        return this.definition.choices[choiceIndex];
    }
}
