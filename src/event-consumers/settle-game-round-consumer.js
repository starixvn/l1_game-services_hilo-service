import { Core } from 'sc-game-base';
import cardHelper from '../helpers/card-helper';
import { StepModel } from '../models';

export default class SettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    generateResult(runningRound) {
        const resultFromAdmin = this.gameData.settlementResultFromAdmin;

        return runningRound.id === resultFromAdmin.roundId ? resultFromAdmin.result : cardHelper.drawCard(runningRound.cards);
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

        const isWin = cardHelper.isWin(payload.betChoice, previousCard, nextCard);
        await this.addStep(runningRound, previousCard.card, nextCard.card, payload.betChoice);

        const odds = cardHelper.calculateOdd(this.gameData.gameConfigs.odds, previousCard.card, runningRound.stepCount + 1);
        const newStake = isWin ? runningRound.stake * (1 + odds[payload.betChoice]) : runningRound.stake;
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
            newOdds: cardHelper.calculateOdd(this.gameData.gameConfigs.odds, nextCard.card, runningRound.stepCount + 2),
        };

        newInfo.cards.push(nextCard);
        newInfo.result.push(nextCard.card);
        newInfo.settlementResult.push(cardHelper.getSettlementResult(previousCard, nextCard));
        const settleResult = { ...runningRound, ...newInfo, ended: !isWin };

        if (isWin) {
            Object.assign(runningRound, newInfo);
        } else {
            await this.settleMainRound(runningRound, newInfo);
            delete this.gameData.runningRounds[playerUID];
        }

        return settleResult;
    }

    async addStep(runningRound, card1, card2, choice) {
        const newStep = {
            id: runningRound.id,
            uid: runningRound.uid,
            name: runningRound.name,

            time: new Date(),
            stake: runningRound.stake,
            stepCount: runningRound.stepCount + 1,

            card1,
            card2,
            choice,
        };

        await StepModel.create(newStep);
    }

    async settleMainRound(runningRound, newInfo) {
        const updatedInfo = { ended: true, ...newInfo };
        await this.roundsRepository.updateOne({ id: runningRound.id }, { $set: updatedInfo }).exec();
        await this.settleBets({ runningRound, settlementResult: newInfo, roundId: runningRound.id, time: newInfo.subRoundTime });
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
}
