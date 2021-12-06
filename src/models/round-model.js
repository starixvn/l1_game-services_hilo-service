import mongoose from 'mongoose';
import gameSettings from '../game-settings';

const schema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    memberId: { type: Number },
    siteId: { type: String },
    uid: { type: String },

    bet: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    result: { type: [Number] },
    settlementResult: { type: [Number] },

    odds: { type: Object },
    betWin: { type: Number, default: 0 },
    jackpotWin: { type: Number },
    paid: { type: Boolean, default: false },
    time: { type: Date },
    endTime: { type: Date },

    partnerId: { type: String, require: true },
    currency: { type: String, require: true },
    rate: { type: Number, require: true },
    exchangeRateId: { type: Number, require: true },
});

export default mongoose.model(`${gameSettings.name}_round`, schema);
