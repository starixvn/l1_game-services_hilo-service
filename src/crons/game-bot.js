import { Table } from 'sc-game-base';
import gameHelper from '../helpers/game-helper';

export default class GameBot extends Table.Crons.TableGameBot {
    constructor(definition, gameData, publisher, userInfosRepository, tempBetsRepository, betsRepository) {
        super(definition, gameData, publisher, userInfosRepository, tempBetsRepository);

        this.betsRepository = betsRepository;
    }

    resetBot(bot) {
        super.resetBot(bot);
        bot.hasPlayed = false;
    }

    async placeBet(bot) {
        if (bot.hasPlayed) {
            return;
        }

        bot.hasPlayed = true;

        const firstCard = gameHelper.drawCard([]);
        const { exchangeRates } = this.gameData;
        const amount = this.gameData.gameConfigs.minbet;

        const lastRound = (await this.betsRepository
            .findOne({}, 'phien', { sort: { id: -1 } })
            .lean()
            .exec()) ?? { phien: 0 };

        const newBet = {
            uid: bot.id,
            name: bot.name,
            phien: lastRound.phien + 1,
            amount,

            thanhtoan: true,
            time: new Date(),
            endTime: new Date(),
            odds: this.gameData.gameConfigs.odds,
            memberId: 0,
            currency: bot.currency,
            rate: 1,

            totalAmount: amount,
            totalTurns: 0,
            result: [firstCard],
            settlementResult: [],
            exchangeRateId: exchangeRates.exId,
        };

        await this.betsRepository.create(newBet);
    }
}
