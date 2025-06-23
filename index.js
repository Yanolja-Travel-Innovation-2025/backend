const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy!' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/badge', require('./routes/badge'));
app.use('/api/partner', require('./routes/partner'));

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}); 