const cheerio = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');
const axios = require('axios');

const URL = 'https://en.wikipedia.org/wiki/2020_coronavirus_pandemic_in_the_Philippines';

class Scraper {
    async getHTML() {
        const res = await axios(URL);
        return cheerio.load(res.data);
    }
    
    async getCases() {
        const $ = await this.getHTML();
        cheerioTableparser($);
        const rawData = $('.wikitable').first().parsetable(true, true, true);
        
        const formattedData = [];
        
        rawData[0].forEach((item, idx) => {
            if (idx === 0) return;
            
            const obj = {
                "Case No": +item,
                "Date": rawData[1][idx],
                "Age": +rawData[2][idx],
                "Gender": rawData[3][idx],
                "Nationality": rawData[4][idx],
                "Hospital Admitted To": rawData[5][idx],
                "Had Recent Travel History Abroad": rawData[6][idx],
                "Status": rawData[7][idx],
                "Notes": rawData[8][idx]
            };
            
            formattedData.push(obj);
        });
        
        return formattedData;
    }

    async getCasesOutsidePh() {
        const $ = await this.getHTML();
        cheerioTableparser($);
        const rawData = $('.wikitable').eq(1).parsetable(true, true, true);
        
        const formattedData = [];
        
        rawData[0].forEach((item, idx) => {
            if (idx === 0 || idx === rawData[0].length - 1 || idx === rawData[0].length - 2) return;
            
            const obj = {
                "Country/Territory/Place": item,
                "Confirmed": +rawData[1][idx],
                "Recovered": +rawData[2][idx],
                "Died": +rawData[3][idx]
            };
            
            formattedData.push(obj);
        });
        
        return formattedData;
    }

    async getSuspectedCases() {
        const $ = await this.getHTML();
        cheerioTableparser($);
        const rawData = $('.wikitable').eq(3).parsetable(true, true, true);

        return {
            "Confirmed cases": +rawData[1][0],
            "Cases tested negative": +rawData[1][1],
            "Cases pending test results": +rawData[1][2]
        }
    }
}

module.exports = Scraper;