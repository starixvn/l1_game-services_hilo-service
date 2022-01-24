import { Core } from "sc-game-base";
import { drawCard } from "../helpers/deck-helper";
import gameSettings, { choiceNames } from "../game-settings";
import oddsGenerator from "../generators/odds-generator";
import { rankValueMapper, cardRanks } from "../cards";

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
        const betWin = settlementResult.isWin ? settlementResult.betwin - bet.amount : 0;

        return {
            ...settlementResult,
            totalBetAmount: amount,
            netWin: settlementResult.isWin ? betWin : 0,
            totalWin: settlementResult.betwin,
            totalLost: settlementResult.isWin ? 0 : amount,
        };
    }

    async settleTurn(player, payload) {
        const { uid, name } = player;
        const runningRound = this.gameData.ingame[name].betTracks;

        const previousCard = runningRound.result[runningRound.result.length - 1];
        const nextCard = this.generateResult(runningRound);
        const isWin = this.isWin(payload.betChoice, previousCard, nextCard);

        const odds = oddsGenerator.generate(this.gameData.gameConfigs.odds, previousCard.rank, runningRound.totalTurns + 1);

        const newStake = isWin ? runningRound.betwin * (1 + odds[payload.betChoice]) : runningRound.betwin;

        const betWin = isWin ? newStake - runningRound.betwin : 0;
        await this.addBetLog(runningRound, previousCard, nextCard, payload.betChoice, betWin);

        const newOdds = oddsGenerator.generate(this.gameData.gameConfigs.odds, nextCard.rank, runningRound.totalTurns + 2);
        const settlementBetResult = {
            isWin,
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

        if (isWin) {
            Object.assign(runningRound, settlementBetResult);
        } else {
            await this.settleBets(name);
            delete this.gameData.ingame[name].betTracks;
            delete this.gameData.settlementResultFromAdmin[runningRound.name];
        }

        return settleResult;
    }

    async addBetLog(runningRound, card1, card2, choice, betWin) {
        const player = Object.values(this.gameData.realPlayers).find((p) => p.UID === runningRound.uid);
        const rate = player.session.multiplier * this.gameData.exchangeRates.code[player.session.currencyCode];

        const log = {
            uid: runningRound.uid,
            name: runningRound.name,
            roundId: runningRound.id,

            time: new Date(),
            amount: runningRound.betWin,
            betwin: betWin,
            choice,

            memberId: player.session.memberId,
            siteId: player.session.siteId,
            partnerId: player.session.partnerId,
            currency: player.session.currencyName,
            rate: rate,

            order: runningRound.totalTurns + 1,
            cards: [card1, card2],
        };

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

        this.roundResultPublisher.publishRoundResult(this.collectRoundResult(result, settlementResult, roundId));
    }

    isWin(choice, previousCard, nextCard) {
        const value1 = rankValueMapper[previousCard.rank];
        const value2 = rankValueMapper[nextCard.rank];

        if (previousCard.rank === cardRanks.ace || previousCard.rank === cardRanks.two || value1 === value2) {
            return true;
        }

        return (choice === choiceNames.h && value1 < value2) || (choice === choiceNames.l && value2 < value1);
    }

    getSettlementResult(previousCard, nextCard) {
        if (previousCard.rank === nextCard.rank) {
            return gameSettings.tieResult;
        }

        const value1 = rankValueMapper[previousCard.rank];
        const value2 = rankValueMapper[nextCard.rank];

        return value1 < value2 ? choiceNames.h : choiceNames.l;
    }

    queryBets(roundId) {
        return this.roundsRepository.find({ id: roundId }).exec();
    }
}
