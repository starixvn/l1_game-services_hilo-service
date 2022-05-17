import { Core } from "sc-game-base";
import { drawCard } from "../helpers/deck-helper";
import gameSettings from "../game-settings";
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
            this.placeBetPublisher.publishToUser(player.UID, { endDeal: -1, notice: { errorCode: helpers.noticeHelper.invalidBet } });
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
        const betAmountValidationCriteria = await this.composeBalanceValidationCriteria(player, payload);
        const bettingTimeValidationCriteria = this.composeBettingTimeValidationCriteria(player);

        return bettingTimeValidationCriteria.concat(betAmountValidationCriteria);
    }

    composeBettingTimeValidationCriteria(player) {
        const runningRound = this.gameData.ingame[player.profile.name].betTracks;

        return [
            {
                failure: !!runningRound && Object.keys(runningRound).length > 0,
                notice: { errorCode: helpers.noticeHelper.invalidBet },
            },
        ];
    }

    async handleSuccessBet(player, balance, roundId, bet) {
        const rate = this.calculateCurrencyRate(player.session);
        await this.upsertBet(player, roundId, bet, rate);

        const round = this.gameData.ingame[player.profile.name].betTracks;
        round.nextAmounts = this.settleTurnConsumer.calculateWinAmounts(round.result[0], 1, round.betwin);

        this.notifyPlacingBetResult(player, balance, bet, rate);

        if (player.profile.minBet !== balance.minBet || player.profile.maxBet !== balance.maxBet) {
            await this.updateUserStakeLevel(player, balance.minBet, balance.maxBet);
        }
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

        const existingBetFilter = { uid: player.UID, id: roundId };

        if (player.session) {
            newBet.memberId = player.session.memberId;
            newBet.siteId = player.session.siteId;
            newBet.partnerId = player.session.partnerId;
            newBet.currency = player.session.currencyName;

            newBet.operatorId = player.session.partnerId;
            newBet.playerId = player.session.memberId;
        }

        await this.roundsRepository.updateOne(existingBetFilter, { $setOnInsert: newBet }, { upsert: true, setDefaultsOnInsert: true });
        this.gameData.ingame[player.profile.name].betTracks = newBet;
    }

    decreaseBetTracks(playerName) {
        const { id: roundId } = this.gameData.ingame[playerName].betTracks ?? {};

        if (!roundId) {
            delete this.gameData.ingame[playerName].betTracks;
        }
    }

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
                amount,
                betwin: amount,
                totalTurns: 0,
                nextAmounts: betTracks.nextAmounts,
                remainingTime: gameSettings.durations.turnTime,
            },
            user: { ...balance },
        };
    }
}
