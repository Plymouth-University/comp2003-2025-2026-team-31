const express = require('express');
const cors = require('cors');
const festivalRoutes = require('./routes/festival');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/images', express.static('public/images'));

app.use('/api/festivals', festivalRoutes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});