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
        const resultFromAdmin = this.gameData.settlementResultFromAdmin ? this.gameData.settlementResultFromAdmin[runningRound.name] : null;
        const turnOrder = runningRound.totalTurns + 1;

        return !!resultFromAdmin && turnOrder < resultFromAdmin.length
            ? resultFromAdmin[turnOrder]
            : drawCard(runningRound.result[runningRound.result.length - 1]);
    }

    async settleTurn(player, payload) {
        const { uid, name } = player;
        const runningRound = this.gameData.ingame[name].betTracks;
        const turnResult = this.calculateTurnResult(payload, runningRound);
        const settleResult = { ...runningRound, ...turnResult };

        await this.addBetLog(runningRound, payload.betChoice, turnResult);
        await this.roundsRepository.updateOne({ id: runningRound.id }, { $set: turnResult }).exec();

        const { betwin, result, settlementResult, remainingTime, nextAmounts, totalTurns } = settleResult;

        const endDealData = {
            endDeal: 1,
            result: {
                roundId: runningRound.id,
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
            delete this.gameData.ingame[name].betTracks;
            delete this.gameData.settlementResultFromAdmin[runningRound.name];
        } else {
            Object.assign(runningRound, turnResult);
        }

        return settleResult;
    }

    calculateTurnResult(payload, runningRound) {
        const currentCard = runningRound.result[runningRound.result.length - 1];
        const resultCard = this.generateResult(runningRound);
        const isLose = this.isLose(payload.betChoice, currentCard, resultCard);
        const odds = oddsGenerator.generate(this.gameData.gameConfigs.odds, currentCard.rank, runningRound.totalTurns + 1);
        const settlementResult = this.getSettlementResult(currentCard, resultCard);
        let betwin;
        if (settlementResult === payload.betChoice) {
            betwin = parseFloat((runningRound.betwin * (1 + odds[payload.betChoice])).toFixed(2));
        } else {
            betwin = isLose ? 0 : runningRound.betwin;
        }

        return {
            isLose,
            betwin,
            totalTurns: runningRound.totalTurns + 1,
            result: [...runningRound.result, resultCard],
            settlementResult: [...runningRound.settlementResult, settlementResult],
            turnTime: new Date(),
            remainingTime: gameSettings.durations.turnTime,
            nextAmounts: isLose ? null : this.calculateWinAmounts(resultCard, runningRound.totalTurns + 2, betwin),
        };
    }

    getSettlementResult(currentCard, resultCard) {
        if (currentCard.rank === resultCard.rank) {
            return gameSettings.tieResult;
        }

        const currentValue = rankValueMapper[currentCard.rank];
        const resultValue = rankValueMapper[resultCard.rank];

        return currentValue < resultValue ? choiceNames.h : choiceNames.l;
    }

    async addBetLog(runningRound, choice, turnResult) {
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
