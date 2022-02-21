import Chance from "chance";
import { Core } from "sc-game-base";
import { cardRanks } from "../cards";
import { choiceNames } from "../game-settings";

export default class GameCron extends Core.Crons.BaseGameCron {
    constructor({
        definition,
        gameData,
        bot,
        settleGameRoundConsumer,
        gameStatusPublisher,
        runningRoundInfoPublisher,
        logService,
        gameConfigsRepository,
        roundsRepository,
        archiveStatusesRepository,
        notificationRepository,
        exchangeRatesRepository,
        currencyGroupGamesRepository,
        partnerConfigRepository,
        currencyGroupRepository,
        currencyRepository,
        collectConsumer,
        settleTurnConsumer,
    }) {
        super({
            definition,
            gameData,
            bot,
            settleGameRoundConsumer,
            gameStatusPublisher,
            runningRoundInfoPublisher,
            logService,
            gameConfigsRepository,
            roundsRepository,
            archiveStatusesRepository,
            notificationRepository,
            exchangeRatesRepository,
            currencyGroupGamesRepository,
            partnerConfigRepository,
            currencyGroupRepository,
            currencyRepository,
        });

        this.collectConsumer = collectConsumer;
        this.settleTurnConsumer = settleTurnConsumer;
        this.chance = new Chance();
    }

    async start() {
        await super.start();

        const lastRound = await this.roundsRepository
            .findOne({}, "id", { sort: { id: -1 } })
            .lean()
            .exec();

        this.gameData.roundId = lastRound ? lastRound.id + 1 : await this.getLastArchiveRound();
        await this.proceedUnsettledBets();
    }

    async proceed() {
        const { durations } = this.definition;

        if (this.gameData.remainingTime === durations.wholeRound) {
            await this.checkGameStatus();
        }

        if (!this.gameData.disabled) {
            this.gameData.remainingTime--;
            await this.processRunningRounds();
        }

        if (this.isStartingTime(this.gameData.remainingTime, durations)) {
            this.bot && (await this.bot.reset());
        }

        if (this.gameData.remainingTime < 0) {
            this.gameData.remainingTime = durations.wholeRound;
        } else if (this.gameData.remainingTime < durations.placingBets) {
            this.bot && (await this.bot.run());
        }
    }

    async processRunningRounds() {
        const currentTime = new Date();

        await Promise.all(
            Object.values(this.gameData.ingame).map(async (player) => {
                const round = player.betTracks;

                if (!round) {
                    return;
                }

                if (round.turnEndTime <= currentTime && round.totalTurns === 0) {
                    const payload = { betChoice: this.autoChooseChoice(round) };
                    await this.settleTurnConsumer.settleTurn(round, payload);
                    return;
                }

                if (round.turnEndTime <= currentTime && round.totalTurns > 0) {
                    await this.collectConsumer.consume({ UID: round.uid, profile: { name: round.name } });
                }
            })
        );
    }

    autoChooseChoice(round) {
        const currentCard = round.result[round.result.length - 1];
        if (currentCard.rank === cardRanks.ace) {
            return choiceNames.l;
        }

        if (currentCard.rank === cardRanks.two) {
            return choiceNames.h;
        }

        const choiceIndex = this.chance.integer({ min: 0, max: 1 });
        return this.definition.choices[choiceIndex];
    }

    async proceedUnsettledBets() {
        const unsettledBets = await this.roundsRepository.find({ paid: false }).lean().exec();
        unsettledBets.forEach((bet) => {
            this.gameData.ingame[bet.name] = {
                betTracks: {
                    ...bet,
                    turnResult: { isLose: false, betwin: bet.totalTurns === 0 ? bet.amount : bet.betwin },
                },
            };
        });

        await Promise.all(
            Object.values(this.gameData.ingame).map((player) => this.settleGameRoundConsumer.settleBets(player.betTracks.name))
        );
    }

    async enableGame() {
        await Promise.all(
            Object.values(this.gameData.ingame).map(async (player) => {
                if (player.betTracks?.name) {
                    const bet = player.betTracks;
                    bet.turnResult = {
                        isLose: false,
                        betwin: bet.totalTurns === 0 ? bet.amount : bet.betwin,
                    };

                    await this.settleGameRoundConsumer.settleBets(bet.name);
                }
            })
        );

        await super.enableGame();
    }
}
