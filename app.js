const express = require('express');

const app = express();

// Routes
app.get('/', (req, res) => {
  res.send('Hello Ichigo!!');
});

const userRouter = require('./routes/users');

app.use('/users', userRouter);

app.listen(3000);

