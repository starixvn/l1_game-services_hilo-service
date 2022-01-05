import { Core } from 'sc-game-base';

export default class HistoryQuery extends Core.QueryApis.HistoryQuery {
    getBetLogDetails(player, roundId) {
        return this.betLogsRepository
            .find({ phien: roundId, uid: player.UID }, {}, { sort: { _id: -1 } })
            .lean()
            .exec();
    }
}
