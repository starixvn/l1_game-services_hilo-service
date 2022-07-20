import { drawCard } from "../helpers/deck-helper";
import gameSettings, { choiceNames } from "../game-settings";
import oddsGenerator from "../generators/odds-generator";
import { rankValueMapper } from "../cards";

export default class SettleTurnConsumer {
    constructor({ gameData, betLogsRepository, settleGameRoundConsumer, roundsRepository, userBetResultPublisher }) {
        this.gameData = gameData;
        this.betLogsRepository = betLogsRepository;
        this.settleGameRoundConsumer = settleGameRoundConsumer;
        this.roundsRepository = roundsRepository;
        this.userBetResultPublisher = userBetResultPublisher;
    }

    generateResult(runningRound) {
        const { randomMode } = this.gameData.gameConfigs;

        const resultFromAdmin =
            (this.gameData.settlementResultFromAdmin ? this.gameData.settlementResultFromAdmin[runningRound.name] : []) ?? [];
        const turnOrder = runningRound.totalTurns + 1;

        return turnOrder < resultFromAdmin.length
            ? resultFromAdmin[turnOrder]
            : drawCard(randomMode, runningRound.result[runningRound.result.length - 1]);
    }

    async settleTurn(player, payload) {
        const { uid, name } = player;
        const runningRound = this.gameData.ingame[name].betTracks;
        const turnResult = this.calculateTurnResult(payload, runningRound);
        const settleResult = { ...runningRound, ...turnResult };

        await this.insertBetLog(runningRound, payload.betChoice, turnResult);
        await this.roundsRepository.updateOne({ id: runningRound.id }, { $set: turnResult }).exec();

        const { betwin, result, settlementResult, remainingTime, nextAmounts, totalTurns } = settleResult;

        const endDealData = {
            endDeal: 1,
            result: {
                roundId: runningRound.id,
                amount: runningRound.amount,
                betwin,
                result,
                settlementResult,
                remainingTime,
                nextAmounts,
                totalTurns,
            },
        };

        await this.userBetResultPublisher.publishToUser(uid, endDealData);
        runningRound.turnResult = turnResult;

        if (turnResult.isLose) {
            await this.settleGameRoundConsumer.settleBets(name);
        } else {
            Object.assign(runningRound, turnResult);
        }

        return settleResult;
    }

    calculateTurnResult(payload, runningRound) {
        const turnTime = new Date();
        const currentCard = runningRound.result[runningRound.result.length - 1];
        const resultCard = this.generateResult(runningRound);
        const isLose = this.isLose(payload.betChoice, currentCard, resultCard);
        const odds = oddsGenerator.generate(this.gameData.gameConfigs.odds, currentCard.rank, runningRound.totalTurns + 1);
        const settlementResult = this.getSettlementResult(currentCard, resultCard);
        const betwin = isLose ? 0 : this.calculateBetWin(settlementResult, payload, runningRound.betwin, odds);

        return {
            isLose,
            betwin,
            totalTurns: runningRound.totalTurns + 1,
            result: [...runningRound.result, resultCard],
            settlementResult: [...runningRound.settlementResult, settlementResult],
            turnTime,
            turnEndTime: new Date(turnTime.getTime() + gameSettings.durations.turnTime * 1000),
            remainingTime: gameSettings.durations.turnTime,
            nextAmounts: isLose ? null : this.calculateWinAmounts(resultCard, runningRound.totalTurns + 2, betwin),
        };
    }

    calculateBetWin(settlementResult, payload, betAmount, odds) {
        const betWin = settlementResult === payload.betChoice ? betAmount * (1 + odds[payload.betChoice]) : betAmount;

        return parseFloat(betWin.toFixed(2));
    }

    getSettlementResult(currentCard, resultCard) {
        if (currentCard.rank === resultCard.rank) {
            return gameSettings.tieResult;
        }

        const currentValue = rankValueMapper[currentCard.rank];
        const resultValue = rankValueMapper[resultCard.rank];

        return currentValue < resultValue ? choiceNames.h : choiceNames.l;
    }

    async insertBetLog(runningRound, choice, turnResult) {
        const currentCard = runningRound.result[runningRound.result.length - 1];
        const resultCard = turnResult.result[turnResult.result.length - 1];

        const log = {
            uid: runningRound.uid,
            name: runningRound.name,
            roundId: runningRound.id,

            time: new Date(),
            amount: runningRound.betwin,
            betwin: turnResult.betwin,
            choice,

            memberId: runningRound.memberId,
            siteId: runningRound.siteId,
            partnerId: runningRound.partnerId,
            currency: runningRound.currency,
            rate: runningRound.rate,

            order: runningRound.totalTurns + 1,
            cards: [currentCard, resultCard],

            operatorId: runningRound.partnerId,
            playerId: runningRound.memberId,
        };

        await this.betLogsRepository.create(log);
    }

    isLose(choice, currentCard, resultCard) {
        const currentValue = rankValueMapper[currentCard.rank];
        const resultValue = rankValueMapper[resultCard.rank];

        return (choice === choiceNames.h && resultValue < currentValue) || (choice === choiceNames.l && resultValue > currentValue);
    }

    calculateWinAmounts(currentCard, totalTurns, currentAmount) {
        const odds = oddsGenerator.generate(this.gameData.gameConfigs.odds, currentCard.rank, totalTurns);

        return {
            [choiceNames.h]: parseFloat(((1 + odds[choiceNames.h]) * currentAmount).toFixed(2)),
            [choiceNames.l]: parseFloat(((1 + odds[choiceNames.l]) * currentAmount).toFixed(2)),
        };
    }
}
