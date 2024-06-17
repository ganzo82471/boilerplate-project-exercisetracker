const express = require('express')
const app = express()
const mongoose = require('mongoose');
const cors = require('cors')

require('dotenv').config()
app.use(express.urlencoded({ extended: true }));
 // Connect to MongoDB
 mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
 .then(() => {
   console.log('Connected to MongoDB');
 })
 .catch((err) => {
   console.error('Error connecting to MongoDB:', err);
 });
 const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


  const userSchema = new mongoose.Schema({
    username: String
  });
  
  const exerciseSchema = new mongoose.Schema({
    user_id: String,
    description: String,
    duration: Number,
    date: Date
  });


  const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);


app.post('/api/users', async (req, res) => {
  try {
    const user = new User({
      username: req.body.username
    });
    await user.save();
    res.json({
      username: user.username,
      _id: user._id
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/api/users/:user_id/exercises', async (req, res) => {
  try {
    const exercise = new Exercise({
      user_id: req.params.user_id,
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date ? new Date(req.body.date) : Date.now()
    });
    await exercise.save();
    const user = await User.findById(req.params.user_id);
    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toString(),
      _id: exercise._id
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});



app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const userId = req.params._id;
    const { from, to, limit } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query = { user_id: userId };
    if (from && to) {
      query.date = { $gte: new Date(from), $lte: new Date(to) };
    } else if (from) {
      query.date = { $gte: new Date(from) };
    } else if (to) {
      query.date = { $lte: new Date(to) };
    }

    let exercisesQuery = Exercise.find(query);
    if (limit) {
      exercisesQuery = exercisesQuery.limit(parseInt(limit));
    }
    const exercises = await exercisesQuery.exec();

    const logs = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toString()
    }));

    res.json({
      username: user.username,
      count: logs.length,
      _id: userId,
      log: logs
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});









app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
