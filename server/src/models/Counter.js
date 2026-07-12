const mongoose = require('mongoose');
const Counter = mongoose.model('Counter', new mongoose.Schema({ key: { type: String, unique: true }, value: { type: Number, default: 0 } }));
async function nextSequence(key) { const counter = await Counter.findOneAndUpdate({ key }, { $inc: { value: 1 } }, { new: true, upsert: true }); return counter.value; }
module.exports = { Counter, nextSequence };
