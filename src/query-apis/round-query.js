import { Core } from 'sc-game-base';

export default class RoundQuery extends Core.QueryApis.RoundQuery {
    async getOne(id, projections = { _id: false }) {
        return this.roundsRepository.findOne({ phien: id }, projections).lean().exec();
    }

    async getList(limit, projections) {
        const rounds = await this.roundsRepository
            .find({}, projections, { sort: { _id: -1 }, limit: limit })
            .lean()
            .exec();

        return rounds.map((round) => {
            return {
                roundId: round.phien,
                result: round.result,
                settlementResult: round.settlementResult,
            };
        });
    }
}
