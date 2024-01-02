import { Core } from "sc-game-base";
import { initAPIStub, stubUserService } from "sc-game-service-integration-utils";

import appConfigs from "../../../src/app-configs.IGT";
import gameSettings from "../../../src/game-settings";
import ServiceContainerRegistry from "../../../src/service-container-registry";

export const run = async () => {
    initAPIStub(appConfigs.apiSettings.apiUrl);
    stubUserService(appConfigs);

    const gameData = new Core.GameData(gameSettings.durations.wholeRound);
    const definition = new Core.GameDefinition(gameSettings);
    const container = new ServiceContainerRegistry().register(appConfigs, definition, gameData);

    const app = new Core.BaseGameApp(gameSettings.name, appConfigs);
    await app.run();
    await app.startGame(container);
};

run();
