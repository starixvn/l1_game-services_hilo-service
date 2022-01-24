import errorCodes from "../constants/error-codes";
import gameSettings from "../game-settings";

export default class CollectConsumer {
    constructor(definition, gameData, publisher) {
        this.definition = definition;
        this.gameData = gameData;
        this.publisher = publisher;
    }

    validate(runningRound) {
        if (!runningRound) {
            return { notice: errorCodes.roundEnded };
        }

        if (runningRound.totalTurns === 0 || !this.gameData.gameConfigs.enabled) {
            return { notice: errorCodes.cannotCollect };
        }

        return null;
    }

    async consume(player) {
        const runningRound = this.gameData.ingame[player.profile.name]?.betTracks;
        const failedCriterion = this.validate(runningRound);

        if (!!failedCriterion) {
            this.publisher.publishToUser(player.UID, { isCollect: -1, ...failedCriterion });
            return;
        }

        this.gameData.ingame[player.profile.name].betQueue = this.gameData.ingame[player.profile.name].betQueue ?? [];
        this.gameData.ingame[player.profile.name].betQueue.push({ player, payload: { action: gameSettings.actions.collect } });
    }
}
