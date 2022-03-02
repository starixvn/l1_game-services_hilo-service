import { Core } from "sc-game-base";

export default class RoundQuery extends Core.QueryApis.RoundQuery {
    async getList(limit, projections) {
        const rounds = await this.roundsRepository
            .find({}, projections, { sort: { _id: -1 }, limit: limit })
            .lean()
            .exec();

        return rounds.map((round) => {
            return {
                roundId: round.id,
                result: round.result,
                settlementResult: round.settlementResult,
            };
        });
    }

    async countDocuments(player) {
        return this.roundsRepository.countDocuments({ uid: player.UID, paid: true }).exec();
    }

    async getPlayerRounds(player, page, pageSize) {
        const filter = { uid: player.UID, paid: true };
        const numberOfSkippedBets = (page - 1) * pageSize;
        const betProjection = {
            _id: false,
            uid: false,
            paid: false,
            siteId: false,
            memberId: false,
            __v: false,
            __archive: false,
        };

        return this.roundsRepository
            .find(filter, betProjection, { sort: { _id: -1 }, skip: numberOfSkippedBets, limit: pageSize })
            .lean()
            .exec();
    }
}
