import { Core } from 'sc-game-base';
import gameHelper from '../helpers/game-helper';
import { StepModel } from '../models';

export default class SettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    generateResult(runningRound) {
        const resultFromAdmin = this.gameData.settlementResultFromAdmin;

        return runningRound.id === resultFromAdmin.roundId ? resultFromAdmin.result : gameHelper.drawCard(runningRound.cards);
    }

    calculateBetResult(settlementResult, bet) {
        const amount = bet.newGameChoice;

        return {
            ...settlementResult,
            totalBetAmount: amount,
            netWin: settlementResult.isWin ? (settlementResult.betWin - amount).toFixed(2) : 0,
            totalWin: settlementResult.betWin.toFixed(2),
            totalLost: settlementResult.isWin ? 0 : amount,
        };
    }

    async settleSubRound(playerUID, payload) {
        const runningRound = this.gameData.runningRounds[playerUID];
        if (runningRound.anNon) {
            return runningRound;
        }

        const previousCard = runningRound.cards[runningRound.cards.length - 1];
        const nextCard = this.generateResult(runningRound);

        const isWin = gameHelper.isWin(payload.betChoice, previousCard, nextCard);

        const odds = gameHelper.calculateOdd(this.gameData.gameConfigs.odds, previousCard.card, runningRound.stepCount + 1);
        const newStake = isWin ? runningRound.stake * (1 + odds[payload.betChoice]) : runningRound.stake;
        await this.addStep(runningRound, previousCard, nextCard, payload.betChoice, newStake - runningRound.stake);
        const newInfo = {
            isWin,
            subRoundTime: new Date(),
            stake: newStake,
            betWin: isWin ? newStake : 0,
            stepCount: runningRound.stepCount + 1,
            cards: runningRound.cards,
            result: runningRound.result,
            settlementResult: runningRound.settlementResult,
            odds,
            newOdds: gameHelper.calculateOdd(this.gameData.gameConfigs.odds, nextCard.card, runningRound.stepCount + 2),
            ended: !isWin,
        };

        newInfo.cards.push(nextCard);
        newInfo.result.push(nextCard);
        newInfo.settlementResult.push(gameHelper.getSettlementResult(previousCard, nextCard));
        await this.roundsRepository.updateOne({ id: runningRound.id }, { $set: newInfo }).exec();

        const settleResult = { ...runningRound, ...newInfo };
        await this.userBetResultPublisher.publish(runningRound.uid, settleResult);

        if (isWin) {
            Object.assign(runningRound, newInfo);
        } else {
            await this.settleBets({ runningRound, settlementResult: newInfo, roundId: runningRound.id, time: newInfo.subRoundTime });
            delete this.gameData.runningRounds[playerUID];
        }

        return settleResult;
    }

    async addStep(runningRound, card1, card2, choice, betWin) {
        const newStep = {
            id: runningRound.id,
            uid: runningRound.uid,
            name: runningRound.name,

            time: new Date(),
            stake: runningRound.stake,
            stepCount: runningRound.stepCount + 1,
            betWin,
            card1,
            card2,
            choice,
        };

        await StepModel.create(newStep);
    }

    async anNon(playerUid) {
        const runningRound = this.gameData.runningRounds[playerUid];
        const updatedInfo = { ended: true };
        await this.roundsRepository.updateOne({ id: runningRound.id }, { $set: updatedInfo }).exec();

        const newInfo = {
            isWin: true,
            subRoundTime: new Date(),
            stake: runningRound.stake,
            betWin: runningRound.stake,
            stepCount: runningRound.stepCount,
            cards: runningRound.cards,
            result: runningRound.result,
            settlementResult: runningRound.settlementResult,
        };

        await this.settleBets({ runningRound, settlementResult: newInfo, roundId: runningRound.id, time: newInfo.subRoundTime });
        delete this.gameData.runningRounds[playerUid];
    }

    async settleRound() {}
}
