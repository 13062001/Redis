const express = require('express');
const User = require('../MongoDB/userSchema');
const { Redis } = require('ioredis');

const redis = new Redis({
    host: 'localhost',
    port: 6379
})

const app = express();

app.use(express.json());

app.get('/getUser/:id', async (req, res) => {
    const id = req.params.id;
    const redisKey = `User:${id}`;
    try {
        let rlt = await redis.get(redisKey);

        if (rlt) {
            return res.json(JSON.parse(rlt));
        }
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await redis.set(redisKey, JSON.stringify(user));
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


app.post('/saveUser', async (req, res) => {
    try {
        const user = new User(req.body);
        const result = await user.save();
        if (result) {
            await redis.lpush(`userList`, result);
            await redis.incr('count')

        }
        res.status(201).json({ message: 'User is saved successfully', user: result });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

app.get('/getUsers', async (req, res) => {
    try {
        const redisCount = await redis.get('count');
        const count = parseInt(redisCount, 10);
        const arr = await redis.lrange('userList', 0, -1);
        if (arr.length !== (count || 0)) {
            const users = await User.find();
            await redis.del('userList');
            for (let user of users) {
                await redis.rpush('userList', JSON.stringify(user));
            }
            await redis.set('count', users.length);
            res.json(users);
        } else {
            const parsedUsers = arr.map(user => JSON.parse(user));
            res.json(parsedUsers);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.put('/update/:id', async (req, res) => {
    try {
        const user = req.body;
        const userId = user._id;
        const result = await User.updateOne({ _id: userId }, { $set: user });
        if (result.matchedCount > 0) {
            let arr = await redis.lrange('userList', 0, -1);
            arr = arr.map(ele => JSON.parse(ele)); 
            arr = arr.map(user2 => {
                if (user2._id.toString() === userId) {
                    return { ...user2, ...user }; 
                }
                return user2; 
            });
            await redis.del('userList');
            for (let updatedUser of arr) {
                await redis.rpush('userList', JSON.stringify(updatedUser)); 
            }
            res.status(200).json(arr);
        } else {
            res.status(404).json({ message: 'User not found or no changes made.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


app.delete('/delete/:id', async (req, res) => {
    const id = req.params.id;
    const result = await User.deleteOne({ _id: id });
    if (result.deletedCount > 0) {
        const arr = await redis.lrange('userList', 0, -1)
        let user;
        arr.map(ele => JSON.parse(ele)).filter(ele => {
            ele._id.toString() !== id;
            if (ele._id.toString() == id)
                user = ele;
        });
        await redis.del('userList');
        await redis.decr('count')
        arr.forEach(async ele => await redis.rpush('userList', JSON.stringify(ele)))
        res.send(user);
    }
    else
        res.send('User Not Found')
})



app.listen(7050, () => console.log('Server is running on port 7050'));
