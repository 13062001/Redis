const express = require('express');
const User = require('../MongoDB/userSchema');

const route = express.Router();

// GET request to retrieve a user by ID
route.get('/getUser/:id', async (req, res) => {
    const id = req.params.id; // Access the ID from the request params
    console.log(123)
    try {
        const user = await User.findById(id); // Find the user by ID
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// POST request to save a new user
route.post('/saveUser', async (req, res) => {
    try {
        console.log(req.body);
        const user = new User(req.body); // Create a new user from the request body
        const result = await user.save(); // Save the user to the database
        res.status(201).json({ message: 'User is saved successfully', user: result });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

module.exports = route;
