import { utils } from "sc-common";
import { Table } from "sc-game-base";
import { getCardFromAdmin } from "../helpers/deck-helper";

export default class HttpRouter extends Table.Routers.TableHttpRouter {
    init(app) {
        super.init(app);

        app.post(
            "/api/set-result",
            utils.authentication.useAuthenticate({
                authUrl: this.appConfigs.apiSettings.authUrl,
                audiences: this.appConfigs.authenticateSettings.audiences,
            }),
            (_req, res) => this.handleSetResult(_req.body, res)
        );
    }

    async handleSetResult(params, res) {
        try {
            if (!params || !params.name || !params.result) {
                this.logService.logError("receives a result cheating call with invalid params.");
                res.send([]);
                return;
            }

            this.logService.logWarning(`receives a result cheating call ${JSON.stringify(params)}.`);

            const result = this.generateResult(params.result);
            this.gameData.settlementResultFromAdmin[params.name] = result;
            res.send(result);
        } catch (error) {
            this.logService.logError(error);
            res.send([]);
        }
    }

    generateResult(ranks) {
        const result = [];
        for (const rank of ranks) {
            result.push(getCardFromAdmin(rank, result));
        }

        return result;
    }
}
