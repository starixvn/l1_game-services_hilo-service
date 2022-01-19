import { Core } from "sc-game-base";

export default class HistoryQuery extends Core.QueryApis.HistoryQuery {
    constructor(roundQuery, roundsRepository, betLogsRepository, userInfosRepository, userSessionsRepository) {
        super(roundQuery, null, betLogsRepository, userInfosRepository, userSessionsRepository);
        this.roundsRepository = roundsRepository;
    }

    getBetLogDetails(player, roundId) {
        return this.betLogsRepository
            .find({ roundId: roundId, uid: player.UID }, {}, { sort: { _id: -1 } })
            .lean()
            .exec();
    }

    async queryHistory(player, page, pageSize) {
        if (page < 1 || !player) {
            return {};
        }

        const filter = { uid: player.UID, paid: true };
        const numberOfSkippedBets = (page - 1) * pageSize;
        const total = await this.roundsRepository.countDocuments(filter).exec();
        const betProjection = {
            _id: false,
            uid: false,
            paid: false,
            siteId: false,
            memberId: false,
            __v: false,
            __archive: false,
        };
        const bets = await this.roundsRepository
            .find(filter, betProjection, { sort: { _id: -1 }, skip: numberOfSkippedBets, limit: pageSize })
            .lean()
            .exec();
        let betLogs = [];

        if (bets && bets.length > 0) {
            betLogs = await Promise.all(
                bets.map(async (bet) => {
                    const betLogDetails = this.betLogsRepository ? await this.getBetLogDetails(player, bet.id) : [];

                    return {
                        ...this.convertBet(bet),
                        result: bet.result,
                        settlementResult: bet.settlementResult,
                        betLogDetails: this.convertBetLogs(betLogDetails),
                    };
                })
            );
        }

        return { history: { betLogs, page, pageSize, total } };
    }
}
