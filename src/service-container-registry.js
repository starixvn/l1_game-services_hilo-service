import { asValue, asClass } from 'awilix';
import { Table } from 'sc-game-base';
import { InGameConsumer, PlaceBetConsumer, SettleGameRoundConsumer } from './event-consumers';
import { RoundModel, BetModel } from './models';
import { SocketRouter } from './routers';
import { ProcessBetQueue, GameCron, GameBot } from './crons';
import { HistoryQuery } from './query-apis';

export default class ServiceContainerRegistry extends Table.TableContainerRegistry {
    registerModels() {
        super.registerModels();

        this.container.register({
            roundsRepository: asValue(RoundModel),
            betsRepository: asValue(BetModel),
        });
    }

    registerConsumers() {
        super.registerConsumers();

        this.container.register({
            inGameConsumer: asClass(InGameConsumer).singleton(),
            placeBetConsumer: asClass(PlaceBetConsumer).singleton(),
            settleGameRoundConsumer: asClass(SettleGameRoundConsumer).singleton().proxy(),
        });
    }

    registerRouters() {
        super.registerRouters();

        this.container.register({
            socketRouter: asClass(SocketRouter).proxy(),
        });
    }

    registerCrons() {
        super.registerCrons();

        this.container.register({
            processBetQueue: asClass(ProcessBetQueue).singleton().proxy(),
            gameCron: asClass(GameCron).singleton().proxy(),
            bot: asClass(GameBot).singleton(),
        });
    }

    registerApis() {
        super.registerApis();

        this.container.register({
            historyQuery: asClass(HistoryQuery).singleton(),
        });
    }
}
