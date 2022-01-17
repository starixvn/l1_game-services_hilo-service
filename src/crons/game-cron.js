import Chance from 'chance';
import { Table } from 'sc-game-base';

export default class GameCron extends Table.Crons.TableGameCron {
    constructor(params) {
        super(params);
        this.collectConsumer = params.collectConsumer;
        this.chance = new Chance();
    }

    async start() {
        await super.start();

        const lastRound = await this.roundsRepository
            .findOne({}, 'id', { sort: { id: -1 } })
            .lean()
            .exec();

        this.gameData.roundId = lastRound ? lastRound.id + 1 : await this.getLastArchiveRound();
        await this.proceedUnsettledBets();
    }

    async proceed() {
        await this.processRunningRounds();
        await super.proceed();
    }

    async processRunningRounds() {
        const players = Object.values(this.gameData.ingame);
        const currentTime = new Date();

        for (let i = 0; i < players.length; i++) {
            const round = players[i].betTracks;

            if (round.turnEndTime <= currentTime && round.totalTurns === 0) {
                const payload = { betChoice: this.autoChooseChoice() };
                await this.settleGameRoundConsumer.settleTurn(round, payload);
                continue;
            }

            if (round.turnEndTime <= currentTime && round.totalTurns > 0) {
                await this.collectConsumer.consume({ UID: round.uid });
            }
        }
    }

    autoChooseChoice() {
        const choiceIndex = this.chance.integer({ min: 0, max: 1 });
        return this.definition.choices[choiceIndex];
    }

    async proceedUnsettledBets() {
        const unsettledBets = await this.roundsRepository.find({ endTime: null, paid: false }).lean().exec();
        unsettledBets.forEach((bet) => {
            this.gameData.ingame[bet.name] = {
                betTracks: {
                    ...bet,
                    settlementBetResult: {
                        isWin: true,
                        betwin: bet.betwin,
                    },
                },
            };
        });

        await Promise.all(
            Object.values(this.gameData.ingame).map((player) => this.settleGameRoundConsumer.settleBets(player.betTracks.name))
        );
    }

    resetForNewRound() {}
}
