const express = require('express');
const cors = require('cors');
const festivalRoutes = require('./routes/festival');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/images', express.static('public/images'));

app.use('/api/festivals', festivalRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});