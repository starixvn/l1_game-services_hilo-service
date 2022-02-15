import { Core } from "sc-game-base";

export default class InGameConsumer extends Core.BaseEventConsumers.InGameConsumer {
    async buildPayload(player) {
        const { odds } = this.gameData.gameConfigs;
        const { exchangeRates } = this.gameData;
        const { session } = player;
        const rate = exchangeRates.code[session.currencyCode] * session.multiplier;
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === session.currencyGroupId);
        const gameConfigs = { ...settings, odds };
        const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: null };

        await this.getBalance(player, true);

        const user = await this.getUserInfo(player.UID);
        const ownBetsPayload = !!betTracks
            ? {
                  roundId: betTracks.id,
                  amount: betTracks.betwin,
                  result: betTracks.result,
                  remainingTime: betTracks.turnEndTime ? (betTracks.turnEndTime - new Date()) / 1000 : 0,
                  nextAmounts: betTracks.nextAmounts,
              }
            : {};

        return {
            gameConfigs,
            ownBets: ownBetsPayload,
            user: { ...user, rate },
        };
    }
}
