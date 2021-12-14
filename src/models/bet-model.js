import mongoose from 'mongoose';
import gameSettings from '../game-settings';

const schema = new mongoose.Schema({
    uid: { type: String, required: true },
    name: { type: String, required: true },
    phien: { type: Number, required: true },
    newGameChoice: { type: Number, required: true },

    thanhtoan: { type: Boolean, default: false },
    betwin: { type: Number, default: 0 },
    time: { type: Date },
    odds: { type: Object },

    memberId: { type: Number },
    siteId: { type: String },
    freeBet: { type: Boolean },

    currency: { type: String, require: true },
    rate: { type: Number, require: true },
    partnerId: { type: String, require: true },
});

export default mongoose.model(`${gameSettings.name}_bet`, schema);
