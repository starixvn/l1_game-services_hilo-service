import mongoose from "mongoose";
import gameSettings from "../game-settings";

const schema = new mongoose.Schema({
    uid: { type: String, required: true },
    name: { type: String, required: true },
    roundId: { type: Number, required: true },

    time: { type: Date },
    amount: { type: Number, default: 0 },
    betwin: { type: Number, default: 0 },
    choice: { type: String },
    siteId: { type: String },

    currency: { type: String, required: true },
    rate: { type: Number, required: true },

    order: { type: Number, default: 0 },
    cards: { type: Array },

    operatorId: { type: String, required: true },
    playerId: { type: String },
});

export default mongoose.model(`${gameSettings.name}_betlog`, schema);
