import mongoose from 'mongoose';
import gameSettings from '../game-settings';

const schema = new mongoose.Schema({
    id: { type: Number, required: true },
    uid: { type: String, required: true },
    name: { type: String, required: true },

    roundStartTime: { type: Date },
    subRoundTime: { type: Date },
    ended: { type: Boolean, default: false },
    origStake: { type: Number, default: 0 },
    stake: { type: Number, default: 0 },
    betWin: { type: Number, default: 0 },
    stepCount: { type: Number, default: 0 },

    cards: { type: Array },
    result: { type: Array },
    settlementResult: { type: Array },

    exchangeRateId: { type: Number, required: true },
});

export default mongoose.model(`${gameSettings.name}_round`, schema);
