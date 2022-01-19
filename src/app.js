import { Core } from "sc-game-base";
import appConfigs from "./app-configs";
import ServiceContainerRegistry from "./service-container-registry";
import gameSettings from "./game-settings";

export const run = async () => {
    const gameData = new Core.GameData(gameSettings.durations.wholeRound);
    const definition = new Core.GameDefinition(gameSettings);
    const container = new ServiceContainerRegistry().register(appConfigs, definition, gameData);

    const app = new Core.BaseGameApp(gameSettings.name, appConfigs);

    await app.run();
    await app.startGame(container);
};

run();
