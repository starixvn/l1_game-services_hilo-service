import { Table } from 'sc-game-base';
import gameHelper from '../helpers/game-helper';

export default class GameBot extends Table.Crons.TableGameBot {
    constructor(definition, gameData, publisher, userInfosRepository, tempBetsRepository, roundsRepository) {
        super(definition, gameData, publisher, userInfosRepository, tempBetsRepository, roundsRepository);

        this.roundsRepository = roundsRepository;
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

        const lastRound = await this.roundsRepository
            .findOne({}, 'id', { sort: { id: -1 } })
            .lean()
            .exec();

        const newRound = {
            id: (lastRound?.id ?? 0) + 1,
            uid: bot.id,
            name: bot.name,

            roundStartTime: new Date(),
            subRoundTime: new Date(),

            ended: true,
            origStake: amount,
            stake: amount,
            betWin: 0,
            stepCount: 0,

            cards: [firstCard],
            result: [],
            settlementResult: [],

            exchangeRateId: exchangeRates.exId,
        };

        await this.roundsRepository.create(newRound);
    }
}
