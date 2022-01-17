import { Table } from 'sc-game-base';

export default class InGameConsumer extends Table.EventConsumers.TableInGameConsumer {
    async buildPayload(player) {
        const payload = await super.buildPayload(player);

        return {
            ...payload,
            runningRound: this.gameData.ingame.betTracks[player.UID],
        };
    }
}
