import { Core, Table } from 'sc-game-base';
import appConfigs from './app-configs';
import ServiceContainerRegistry from './service-container-registry';
import gameSettings from './game-settings';
import GameData from './game-data';

export const run = async () => {
    const gameData = new GameData(gameSettings.durations.wholeRound);
    const definition = new Table.TableGameDefinition(gameSettings);
    const container = new ServiceContainerRegistry().register(appConfigs, definition, gameData);

    const app = new Core.BaseGameApp(gameSettings.name, appConfigs);

    await app.run();
    await app.startGame(container);

    const processCorruptedBetsConsumer = container.resolve('processCorruptedBetsConsumer');
    await processCorruptedBetsConsumer.consume();
};

run();
