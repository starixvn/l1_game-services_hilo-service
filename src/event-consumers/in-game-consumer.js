import { Table } from 'sc-game-base';

export default class InGameConsumer extends Table.EventConsumers.TableInGameConsumer {
    async buildPayload(player) {
        const payload = await super.buildPayload(player);
        const { ownBets } = payload;

        const resultPayload = {
            ...payload,
            ownBets: {
                roundId: ownBets.id,
                amount: ownBets.betwin,
                result: ownBets.result,
                remainingTime: ownBets.turnEndTime ? (ownBets.turnEndTime - new Date()) / 1000 : 0,
                nextAmounts: ownBets.nextAmounts,
            },
        };

        return {
            ...resultPayload,
            ownBets,
        };
    }
}
