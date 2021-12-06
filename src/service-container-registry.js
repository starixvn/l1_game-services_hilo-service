import { asValue, asClass } from 'awilix';
import { Core } from 'sc-game-base';
import { RoundModel } from './models';
import { PlaceBetConsumer, SettleGameRoundConsumer } from './event-consumers';
import { GameCron, ProcessBetQueue } from './crons';
import { SocketRouter } from './routers';

export default class ServiceContainerRegistry extends Core.ContainerRegistry {
    registerModels() {
        super.registerModels();

        this.container.register({
            roundsRepository: asValue(RoundModel),
        });
    }

    registerConsumers() {
        super.registerConsumers();

        this.container.register({
            placeBetConsumer: asClass(PlaceBetConsumer).singleton(),
            settleGameRoundConsumer: asClass(SettleGameRoundConsumer).singleton().proxy(),
        });
    }

    registerCrons() {
        super.registerCrons();

        this.container.register({
            gameCron: asClass(GameCron).singleton().proxy(),
            processBetQueue: asClass(ProcessBetQueue).singleton().proxy(),
        });
    }

    registerRouters() {
        super.registerRouters();

        this.container.register({
            socketRouter: asClass(SocketRouter).proxy(),
        });
    }
}
