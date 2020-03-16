const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apicache = require('apicache');
const path = require('path');
const Scraper = require('./services/Scraper');

const app = express();
const PORT = 3030;
const cache = apicache.middleware;

const scrape = new Scraper();

app.use(morgan('dev'));
app.use(cors());
app.use(cache('1 hour'));

app.get('/', (_, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/cases', async (_, res) => {
    const data = await scrape.getCases();
    return res.json(data);
});

app.get('/cases-outside-ph', async (_, res) => {
    const data = await scrape.getCasesOutsidePh();
    return res.json(data);
});

app.get('/suspected-cases', async (_, res) => {
    const data = await scrape.getSuspectedCases();
    return res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}...`);
});