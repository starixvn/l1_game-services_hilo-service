import { Core } from "sc-game-base";

export default class InGameConsumer extends Core.BaseEventConsumers.InGameConsumer {
    async buildPayload(player) {
        const { odds } = this.gameData.gameConfigs;
        const { exchangeRates } = this.gameData;
        const { session } = player;
        const rate = exchangeRates.code[session.currencyCode] * session.multiplier;
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === session.currencyGroupId);
        const gameConfigs = { ...settings, odds };
        const { betTracks: ownBets } = this.gameData.ingame[player.profile.name] || { betTracks: {} };

        await this.getBalance(player, true);

        const user = await this.getUserInfo(player.UID);

        return {
            gameConfigs,
            ownBets: {
                roundId: ownBets?.id,
                amount: ownBets?.amount,
                betwin: ownBets?.betwin,
                totalTurns: ownBets?.totalTurns,
                result: ownBets?.result,
                remainingTime: ownBets?.turnEndTime ? (ownBets.turnEndTime - new Date()) / 1000 : 0,
                nextAmounts: ownBets?.nextAmounts,
            },
            user: { ...user, rate },
        };
    }
}
