import { Core } from 'sc-game-base';
import { StepModel } from '../models';

export default class HistoryQuery extends Core.QueryApis.HistoryQuery {
    async queryHistory(player, page, pageSize) {
        if (page < 1 || !player) {
            return {};
        }

        const filter = { uid: player.UID };
        const numberOfSkippedBets = (page - 1) * pageSize;
        const total = await StepModel.countDocuments(filter).exec();
        const bets = await StepModel.find(filter, {}, { sort: { _id: -1 }, skip: numberOfSkippedBets, limit: pageSize })
            .lean()
            .exec();

        return { history: { bets, page, pageSize, total } };
    }
}
