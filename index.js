const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apicache = require('apicache');

const Scraper = require('./services/Scraper');

const app = express();
const PORT = 3030;
const cache = apicache.middleware;

app.use(morgan('dev'));
app.use(cors());
app.use(cache('1 hour'));

app.get('/', (_, res) => res.redirect('https://github.com/sorxrob/coronavirus-ph-api'));

app.get('/cases', async (_, res) => {
    const scraper = new Scraper();
    const data = await scraper.getCases();
    return res.json(data);
});

app.get('/cases-outside-ph', async (_, res) => {
    const scraper = new Scraper();
    const data = await scraper.getCasesOutsidePh();
    return res.json(data);
});

app.get('/suspected-cases', async (_, res) => {
    const scraper = new Scraper();
    const data = await scraper.getSuspectedCases();
    return res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}...`);
});