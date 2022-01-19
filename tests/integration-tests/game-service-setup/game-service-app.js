import { Core, Table } from "sc-game-base";
import { initAPIStub } from "sc-game-service-integration-utils";

import appConfigs from "../../../src/app-configs";
import gameSettings from "../../../src/game-settings";
import ServiceContainerRegistry from "../../../src/service-container-registry";

export const run = async () => {
    initAPIStub(appConfigs.apiSettings.apiUrl);
    const gameData = new Table.TableGameData(gameSettings.durations.wholeRound);
    const definition = new Table.TableGameDefinition(gameSettings);
    const container = new ServiceContainerRegistry().register(appConfigs, definition, gameData);

    const app = new Core.BaseGameApp(gameSettings.name, appConfigs);
    await app.run();
    await app.startGame(container);
};

run();
