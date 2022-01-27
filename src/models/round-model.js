import mongoose from "mongoose";
import gameSettings from "../game-settings";

const schema = new mongoose.Schema({
    uid: { type: String, required: true },
    name: { type: String, required: true },
    id: { type: Number, required: true },
    amount: { type: Number, required: true },

    paid: { type: Boolean, default: false },
    betwin: { type: Number, default: 0 },
    time: { type: Date },
    endTime: { type: Date },
    odds: { type: Object },

    memberId: { type: Number },
    siteId: { type: String, default: "" },

    currency: { type: String, default: "" },
    rate: { type: Number, require: true },
    partnerId: { type: String, default: "" },

    totalTurns: { type: Number, default: 0 },
    result: { type: Array },
    settlementResult: { type: Array },
    exchangeRateId: { type: Number, required: true },
});

export default mongoose.model(`${gameSettings.name}_round`, schema);
