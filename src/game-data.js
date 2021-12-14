import { Table } from 'sc-game-base';

export default class GameData extends Table.TableGameData {
    constructor(remainingTime) {
        super(remainingTime);

        this.runningRounds = {};
    }
}
