import { Core } from "sc-game-base";
import { drawCard } from "../helpers/deck-helper";
import gameSettings, { choiceNames } from "../game-settings";
import oddsGenerator from "../generators/odds-generator";
import { rankValueMapper, cardRanks } from "../cards";
import { createBetLog } from "../generators/bet-log-generator";

export default class SettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    constructor(params) {
        super(params);
        this.betLogsRepository = params.betLogsRepository;
    }

    generateResult(runningRound) {
        const resultFromAdmin = this.gameData.settlementResultFromAdmin ? this.gameData.settlementResultFromAdmin[runningRound.name] : null;

        return !!resultFromAdmin && runningRound.totalTurns < resultFromAdmin.length
            ? resultFromAdmin[runningRound.totalTurns]
            : drawCard(runningRound.result);
    }

    calculateBetResult(settlementResult, bet) {
        const amount = bet.amount;
        const betWin = settlementResult.canPlayNextTurn ? settlementResult.betwin - bet.amount : 0;

        return {
            ...settlementResult,
            totalBetAmount: amount,
            netWin: settlementResult.canPlayNextTurn ? betWin : 0,
            totalWin: settlementResult.betwin,
            totalLost: settlementResult.canPlayNextTurn ? 0 : amount,
        };
    }

    async settleTurn(player, payload) {
        const { uid, name } = player;
        const runningRound = this.gameData.ingame[name].betTracks;

        const previousCard = runningRound.result[runningRound.result.length - 1];
        const nextCard = this.generateResult(runningRound);
        const canPlayNextTurn = this.canPlayNextTurn(payload.betChoice, previousCard, nextCard);

        const odds = oddsGenerator.generate(this.gameData.gameConfigs.odds, previousCard.rank, runningRound.totalTurns + 1);

        const newStake = canPlayNextTurn ? runningRound.betwin * (1 + odds[payload.betChoice]) : runningRound.betwin;

        const betWin = canPlayNextTurn ? newStake - runningRound.betwin : 0;
        await this.addBetLog(runningRound, previousCard, nextCard, payload.betChoice, betWin);

        const newOdds = oddsGenerator.generate(this.gameData.gameConfigs.odds, nextCard.rank, runningRound.totalTurns + 2);
        const settlementBetResult = {
            canPlayNextTurn,
            betwin: newStake,
            totalTurns: runningRound.totalTurns + 1,
            result: runningRound.result,
            settlementResult: runningRound.settlementResult,
            turnTime: new Date(),
            nextAmounts: {
                [choiceNames.h]: parseFloat(((1 + newOdds[choiceNames.h]) * runningRound.betwin).toFixed(2)),
                [choiceNames.l]: parseFloat(((1 + newOdds[choiceNames.l]) * runningRound.betwin).toFixed(2)),
            },
        };

        settlementBetResult.result.push(nextCard);
        settlementBetResult.settlementResult.push(this.getSettlementResult(previousCard, nextCard));
        await this.roundsRepository.updateOne({ id: runningRound.id }, { $set: settlementBetResult }).exec();

        const settleResult = { ...runningRound, ...settlementBetResult };
        await this.userBetResultPublisher.publish(uid, settleResult);
        runningRound.settlementBetResult = settlementBetResult;

        if (canPlayNextTurn) {
            Object.assign(runningRound, settlementBetResult);
        } else {
            await this.settleBets(name);
            delete this.gameData.ingame[name].betTracks;
            delete this.gameData.settlementResultFromAdmin[runningRound.name];
        }

        return settleResult;
    }

    async addBetLog(runningRound, currentCard, resultCard, choice, betWin) {
        const log = createBetLog(this.gameData, runningRound, currentCard, resultCard, choice, betWin);
        await this.betLogsRepository.create(log);
    }

    async settleRound() {}

    async settleBets(name) {
        const result = this.gameData.ingame[name].betTracks;
        const { settlementBetResult: settlementResult, id: roundId } = result;
        const time = settlementResult.turnTime;
        const bets = await this.queryBets(roundId);

        if (bets && bets.length) {
            await Promise.all(
                bets.map(async (bet) => {
                    const betResult = this.calculateBetResult(settlementResult, bet);

                    bet.betwin = betResult.totalWin;
                    bet.paid = true;
                    bet.endTime = new Date();

                    await bet.save();
                    await this.callEndGame(bet, roundId, time, betResult);

                    this.captureBetResult(bet.uid, betResult, bet.rate);
                    await this.userBetResultPublisher.publish(bet.uid, betResult);
                })
            );
        }
    }

    canPlayNextTurn(choice, currentCard, resultCard) {
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

    getSettlementResult(currentCard, resultCard) {
        if (currentCard.rank === resultCard.rank) {
            return gameSettings.tieResult;
        }

        const currentValue = rankValueMapper[currentCard.rank];
        const resultValue = rankValueMapper[resultCard.rank];

        return currentValue < resultValue ? choiceNames.h : choiceNames.l;
    }

    queryBets(roundId) {
        return this.roundsRepository.find({ id: roundId }).exec();
    }
}
