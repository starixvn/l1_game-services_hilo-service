import Chance from "chance";
import { Table } from "sc-game-base";

export default class GameBot extends Table.Crons.TableGameBot {
    constructor(definition, gameData, publisher, userInfosRepository, tempBetsRepository) {
        super(definition, gameData, publisher, userInfosRepository, tempBetsRepository);
        this.chance = new Chance();
    }

    async run() {
        if (this.gameData.gameConfigs?.botenabled && this.maxNumberOfBots > 0) {
            this.gameData.roundId += this.chance.integer({ min: 1, max: this.maxNumberOfBots });
        }
    }
}
