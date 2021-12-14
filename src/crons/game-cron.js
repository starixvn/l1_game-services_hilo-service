import { Table } from 'sc-game-base';
import { Random as RandomJS, MersenneTwister19937 } from 'random-js';

export default class GameCron extends Table.Crons.TableGameCron {
    async proceed() {
        await this.processRunningRounds();

        const { durations } = this.definition;

        if (this.gameData.remainingTime === durations.wholeRound) {
            await this.checkGameStatus();
        }

        if (!this.gameData.disabled) {
            this.gameData.remainingTime--;
        }

        if (this.gameData.remainingTime < 0) {
            this.gameData.remainingTime = durations.wholeRound;
        }
    }

    async processRunningRounds() {
        const runningRounds = Object.values(this.gameData.runningRounds);
        for (var i = 0; i < runningRounds.length; i++) {
            const r = runningRounds[i];
            if (r.anNon) {
                const player = this.gameData.realPlayers[r.uid];
                await this.settleGameRoundConsumer.anNon(player);
                continue;
            }

            if (this.isExpiredRound(r)) {
                const player = this.gameData.realPlayers[r.uid];
                const payload = { betChoice: this.autoChooseChoice() };
                await this.settleGameRoundConsumer.settleSubRound(player, payload);
            }
        }
    }

    isExpiredRound(round) {
        var remainingTime = (round.subRoundTime - new Date()) / 1000 + this.definition.durations.wholeRound;

        return remainingTime < 0;
    }

    autoChooseChoice() {
        const random5 = new RandomJS(MersenneTwister19937.autoSeed());
        const choiceIndex = random5.integer(0, 1);

        return this.definition.choices[choiceIndex];
    }
}
