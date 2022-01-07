import { Table } from 'sc-game-base';
import { Random as RandomJS, MersenneTwister19937 } from 'random-js';
import gameHelper from '../helpers/game-helper';

export default class GameCron extends Table.Crons.TableGameCron {
    constructor(params) {
        super(params);
        this.processCorruptedBetsConsumer = params.processCorruptedBetsConsumer;
    }

    async start() {
        await super.start();
        await this.processCorruptedBetsConsumer.consume();
    }

    async proceed() {
        await this.processRunningRounds();
        await super.proceed();
    }

    async processRunningRounds() {
        const runningRounds = Object.values(this.gameData.runningRounds);
        const currentTime = new Date();

        for (let i = 0; i < runningRounds.length; i++) {
            const r = runningRounds[i];
            if (r.turnEndTime < currentTime) {
                const payload = { betChoice: this.autoChooseChoice() };
                await this.settleGameRoundConsumer.settleTurn(r.uid, payload);
            }
        }
    }

    autoChooseChoice() {
        const random5 = new RandomJS(MersenneTwister19937.autoSeed());
        const choiceIndex = random5.integer(0, 1);

        return this.definition.choices[choiceIndex];
    }
}
