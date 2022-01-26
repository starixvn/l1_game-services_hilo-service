import { Core } from "sc-game-base";
import { drawCard } from "../helpers/deck-helper";
import oddsGenerator from "../generators/odds-generator";
import gameSettings, { choiceNames } from "../game-settings";
import { helpers } from "sc-common";

export default class ProcessBetQueue extends Core.Crons.ProcessBetQueue {
    constructor({
        definition,
        gameData,
        placeBetPublisher,
        placeBet,
        logService,
        betsRepository,
        betLogsRepository,
        userInfosRepository,
        baseMetrics,
        roundsRepository,
        settleGameRoundConsumer,
        settleTurnConsumer,
    }) {
        super({
            definition,
            gameData,
            placeBetPublisher,
            placeBet,
            logService,
            betsRepository,
            betLogsRepository,
            userInfosRepository,
            baseMetrics,
        });

        this.roundsRepository = roundsRepository;
        this.settleGameRoundConsumer = settleGameRoundConsumer;
        this.settleTurnConsumer = settleTurnConsumer;
    }

    async deal(player, bet) {
        const runningRound = this.gameData.ingame[player.profile.name]?.betTracks;
        if (!runningRound || runningRound.totalTurns !== bet.order) {
            this.placeBetPublisher.publishToUser(player.UID, { endBet: -1, notice: { errorCode: helpers.noticeHelper.invalidBet } });
            return;
        }

        await this.settleTurnConsumer.settleTurn({ uid: runningRound.uid, name: player.profile.name }, bet);
    }

    async proceedBet(player, payload) {
        switch (payload.action) {
            case gameSettings.actions.bet:
                await super.proceedBet(player, payload.bet);
                break;
            case gameSettings.actions.collect:
                await this.settleGameRoundConsumer.collect(player);
                break;
            case gameSettings.actions.deal:
                await this.deal(player, payload.bet);
                break;
        }
    }

    async composeValidationCriteria(player, payload) {
        return (await this.composeBalanceValidationCriteria(player, payload)) || [];
    }

    async upsertBet(player, roundId, bet, rate) {
        const firstCard = this.generateFirstCard(player.profile.name);
        const { exchangeRates } = this.gameData;

        const turnTime = new Date();
        const newBet = {
            uid: player.UID,
            name: player.profile.name,
            id: roundId,
            amount: bet.amount,

            time: turnTime,
            odds: this.gameData.gameConfigs.odds,
            rate,
            betwin: bet.amount,
            result: [firstCard],
            settlementResult: [],
            exchangeRateId: exchangeRates.exId,

            totalTurns: 0,
            turnTime: turnTime,
            turnEndTime: new Date(turnTime.getTime() + gameSettings.durations.turnTime * 1000),
        };

        const existingBetFilter = { uid: player.UID, id: roundId, freeBet: bet.freeBet };

        if (player.session) {
            newBet.memberId = player.session.memberId;
            newBet.siteId = player.session.siteId;
            newBet.partnerId = player.session.partnerId;
            newBet.currency = player.session.currencyName;
        }

        await this.roundsRepository.updateOne(existingBetFilter, { $setOnInsert: newBet }, { upsert: true, setDefaultsOnInsert: true });

        const odds = oddsGenerator.generate(this.gameData.gameConfigs.odds, firstCard.rank, 1);
        newBet.nextAmounts = {
            [choiceNames.h]: parseFloat(((1 + odds[choiceNames.h]) * newBet.betwin).toFixed(2)),
            [choiceNames.l]: parseFloat(((1 + odds[choiceNames.l]) * newBet.betwin).toFixed(2)),
        };

        this.gameData.ingame[player.profile.name].betTracks = newBet;
    }

    decreaseBetTracks() {}

    adjustTotalBets() {}

    async insertBetLog() {}

    generateFirstCard(name) {
        const resultFromAdmin = this.gameData.settlementResultFromAdmin ? this.gameData.settlementResultFromAdmin[name] : null;

        return !!resultFromAdmin && resultFromAdmin.length > 0 ? resultFromAdmin[0] : drawCard();
    }

    generatePlacingBetResult(player, balance, bet) {
        const { amount } = bet;
        const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: {} };

        return {
            endBet: amount,
            ownBets: {
                roundId: betTracks.id,
                result: betTracks.result,
                nextAmounts: betTracks.nextAmounts,
                remainingTime: gameSettings.durations.turnTime,
            },
            user: { ...balance },
        };
    }
}
