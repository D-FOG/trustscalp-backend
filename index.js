const express = require('express');
const auth = require('./routes/user.routes');
const connectDb = require('./utils/db');

require('dotenv').config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//database connection
connectDb();

app.use('/api', auth);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});