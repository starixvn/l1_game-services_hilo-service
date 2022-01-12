import { asValue, asClass } from 'awilix';
import { Table } from 'sc-game-base';
import { BetModel, BetLogModel } from './models';
import { SocketRouter, HttpRouter } from './routers';
import { ProcessBetQueue, GameCron, GameBot } from './crons';
import { RoundQuery, HistoryQuery } from './query-apis';
import { InGameConsumer, PlaceBetConsumer, SettleGameRoundConsumer, DealConsumer, CollectConsumer } from './event-consumers';

export default class ServiceContainerRegistry extends Table.TableContainerRegistry {
    registerModels() {
        super.registerModels();

        this.container.register({
            roundsRepository: asValue(BetModel),
            betsRepository: asValue(BetModel),
            betLogsRepository: asValue(BetLogModel),
        });
    }

    registerConsumers() {
        super.registerConsumers();

        this.container.register({
            inGameConsumer: asClass(InGameConsumer).singleton(),
            placeBetConsumer: asClass(PlaceBetConsumer).singleton(),
            settleGameRoundConsumer: asClass(SettleGameRoundConsumer).singleton().proxy(),
            dealConsumer: asClass(DealConsumer).singleton(),
            collectConsumer: asClass(CollectConsumer).singleton(),
        });
    }

    registerRouters() {
        super.registerRouters();

        this.container.register({
            socketRouter: asClass(SocketRouter).proxy(),
            httpRouter: asClass(HttpRouter),
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
            roundQuery: asClass(RoundQuery).singleton(),
            historyQuery: asClass(HistoryQuery).singleton(),
        });
    }
}
