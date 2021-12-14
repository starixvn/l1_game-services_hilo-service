import mongoose from 'mongoose';
import gameSettings from '../game-settings';

const schema = new mongoose.Schema({
    id: { type: Number, required: true },
    uid: { type: String, required: true },
    name: { type: String, required: true },

    time: { type: Date },
    stake: { type: Number, default: 0 },
    stepCount: { type: Number, default: 0 },

    card1: { type: Number },
    card2: { type: Number },
    choice: { type: String },
});

export default mongoose.model(`${gameSettings.name}_step`, schema);
