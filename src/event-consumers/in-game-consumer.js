import { Table } from 'sc-game-base';

export default class InGameConsumer extends Table.EventConsumers.TableInGameConsumer {
    async buildPayload(player) {
        const payload = await super.buildPayload(player);
        const runningRound = this.gameData.runningRounds[player.UID];

        return {
            gameConfigs: payload.gameConfigs,
            roundHistory: payload.roundHistory,
            user: payload.user,
            chips: payload.chips,
            runningRound,
        };
    }
}
