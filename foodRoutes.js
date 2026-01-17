const express = require('express');
const router = express.Router();
const Food = require('./models/Food');

// This route SAVES a food item
router.post('/add', async (req, res) => {
    try {
        const newFood = new Food(req.body);
        const savedFood = await newFood.save();
        res.status(201).json(savedFood);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// This route GETS all food items
router.get('/all', async (req, res) => {
    try {
        const foods = await Food.find();
        res.json(foods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;