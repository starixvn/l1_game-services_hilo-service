import { Core } from "sc-game-base";

export default class HistoryQuery extends Core.QueryApis.HistoryQuery {
    getBetLogDetails(player, roundId) {
        return this.betLogsRepository
            .find({ roundId: roundId, uid: player.UID }, {}, { sort: { order: 1 } })
            .lean()
            .exec();
    }

    async queryHistory(player, page, pageSize) {
        if (page < 1 || !player) {
            return {};
        }

        const total = await this.roundQuery.countDocuments(player);
        const bets = await this.roundQuery.getPlayerRounds(player, page, pageSize);
        let betLogs = [];

        if (bets && bets.length > 0) {
            betLogs = await Promise.all(
                bets.map(async (bet) => {
                    const betLogDetails = (await this.getBetLogDetails(player, bet.id)) ?? [];

                    return {
                        ...bet,
                        result: bet.result,
                        settlementResult: bet.settlementResult,
                        betLogDetails,
                    };
                })
            );
        }

        return { history: { betLogs, page, pageSize, total } };
    }
}
