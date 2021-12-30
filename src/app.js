import { Core, Table } from 'sc-game-base';
import appConfigs from './app-configs';
import ServiceContainerRegistry from './service-container-registry';
import gameSettings from './game-settings';
import GameData from './game-data';
import { RoundModel } from './models';
import gameHelper from './helpers/game-helper';

export const loadRunningRound = async (gameData) => {
    if (!gameData.gameConfigs) {
        return [];
    }

    const rounds = await RoundModel.find({ ended: false }).lean().exec();

    return rounds.forEach((round) => {
        const odds = gameHelper.calculateOdd(gameData.gameConfigs.odds, round.cards[round.cards.length - 1].card, round.cards.length);
        gameData.runningRounds[round.uid] = { ...round, odds };
    });
};

export const run = async () => {
    const gameData = new GameData(gameSettings.durations.wholeRound);
    const definition = new Table.TableGameDefinition(gameSettings);
    const container = new ServiceContainerRegistry().register(appConfigs, definition, gameData);

    const app = new Core.BaseGameApp(gameSettings.name, appConfigs);

    await app.run();
    await app.startGame(container);
    await loadRunningRound(gameData);
};

run();
