const express = require('express');
const app = express();
const PORT = process.env.PORT || 3010;

app.get('/', (req, res) => {
    res.json('Welcome to the API');
});

const LoL = require('./routes/LoL.js');
app.use(LoL);

app.listen(PORT, (req, res) => {
    console.log(`Listening on port ${PORT}`);
});
