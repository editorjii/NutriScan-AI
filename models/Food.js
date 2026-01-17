const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Food', FoodSchema);