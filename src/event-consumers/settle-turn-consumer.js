import { drawCard } from "../helpers/deck-helper";
import gameSettings, { choiceNames } from "../game-settings";
import oddsGenerator from "../generators/odds-generator";
import { rankValueMapper, cardRanks } from "../cards";
import { createBetLog } from "../generators/bet-log-generator";

export default class SettleTurnConsumer {
    constructor({ gameData, betLogsRepository, settleGameRoundConsumer, roundsRepository, userBetResultPublisher }) {
        this.gameData = gameData;
        this.betLogsRepository = betLogsRepository;
        this.settleGameRoundConsumer = settleGameRoundConsumer;
        this.roundsRepository = roundsRepository;
        this.userBetResultPublisher = userBetResultPublisher;
    }

    generateResult(runningRound) {
        const resultFromAdmin = this.gameData.settlementResultFromAdmin ? this.gameData.settlementResultFromAdmin[runningRound.name] : null;

        return !!resultFromAdmin && runningRound.totalTurns < resultFromAdmin.length
            ? resultFromAdmin[runningRound.totalTurns]
            : drawCard(runningRound.result[runningRound.result.length - 1]);
    }

    async settleTurn(player, payload) {
        const { uid, name } = player;
        const runningRound = this.gameData.ingame[name].betTracks;

        const currentCard = runningRound.result[runningRound.result.length - 1];
        const resultCard = this.generateResult(runningRound);
        const isWinOrTie = this.isWinOrTie(payload.betChoice, currentCard, resultCard);
        const odds = oddsGenerator.generate(this.gameData.gameConfigs.odds, currentCard.rank, runningRound.totalTurns + 1);
        const betWin = isWinOrTie ? parseFloat((runningRound.betwin * (1 + odds[payload.betChoice])).toFixed(2)) : 0;

        await this.addBetLog(runningRound, currentCard, resultCard, payload.betChoice, betWin);

        const turnResult = this.calculateTurnResult(isWinOrTie, betWin, runningRound, currentCard, resultCard);
        await this.roundsRepository.updateOne({ id: runningRound.id }, { $set: turnResult }).exec();

        const settleResult = { ...runningRound, ...turnResult };
        await this.userBetResultPublisher.publishToUser(uid, { endBet: 1, bet: payload, result: settleResult });

        runningRound.turnResult = turnResult;

        if (isWinOrTie) {
            Object.assign(runningRound, turnResult);
        } else {
            await this.settleGameRoundConsumer.settleBets(name);
            delete this.gameData.ingame[name].betTracks;
            delete this.gameData.settlementResultFromAdmin[runningRound.name];
        }

        return settleResult;
    }

    calculateTurnResult(isWinOrTie, betwin, runningRound, currentCard, resultCard) {
        const newOdds = oddsGenerator.generate(this.gameData.gameConfigs.odds, resultCard.rank, runningRound.totalTurns + 2);

        const turnResult = {
            isWinOrTie,
            betwin,
            totalTurns: runningRound.totalTurns + 1,
            result: runningRound.result,
            settlementResult: runningRound.settlementResult,
            turnTime: new Date(),
            remainingTime: gameSettings.durations.turnTime,
            nextAmounts: {
                [choiceNames.h]: parseFloat(((1 + newOdds[choiceNames.h]) * runningRound.betwin).toFixed(2)),
                [choiceNames.l]: parseFloat(((1 + newOdds[choiceNames.l]) * runningRound.betwin).toFixed(2)),
            },
        };

        turnResult.result.push(resultCard);
        turnResult.settlementResult.push(this.getSettlementResult(currentCard, resultCard));

        return turnResult;
    }

    getSettlementResult(currentCard, resultCard) {
        if (currentCard.rank === resultCard.rank) {
            return gameSettings.tieResult;
        }

        const currentValue = rankValueMapper[currentCard.rank];
        const resultValue = rankValueMapper[resultCard.rank];

        return currentValue < resultValue ? choiceNames.h : choiceNames.l;
    }

    async addBetLog(runningRound, currentCard, resultCard, choice, betWin) {
        const log = createBetLog(this.gameData, runningRound, currentCard, resultCard, choice, betWin);
        await this.betLogsRepository.create(log);
    }

    isWinOrTie(choice, currentCard, resultCard) {
        if (currentCard.rank === cardRanks.ace || currentCard.rank === cardRanks.two) {
            return true;
        }

        const currentValue = rankValueMapper[currentCard.rank];
        const resultValue = rankValueMapper[resultCard.rank];
        return (
            currentValue === resultValue ||
            (choice === choiceNames.h && currentValue < resultValue) ||
            (choice === choiceNames.l && resultValue < currentValue)
        );
    }
}
