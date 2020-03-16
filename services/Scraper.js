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
                "case_no": +item,
                "date": rawData[1][idx],
                "age": +rawData[2][idx],
                "gender": rawData[3][idx],
                "nationality": rawData[4][idx],
                "hospital_admitted_to": rawData[5][idx],
                "had_recent_travel_hitory_abroad": rawData[6][idx],
                "status": rawData[7][idx],
                "notes": rawData[8][idx]
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
                "country_territory_place": item,
                "confirmed": +rawData[1][idx],
                "recovered": +rawData[2][idx],
                "died": +rawData[3][idx]
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
            "confirmed_cases": +rawData[1][0],
            "cases_tested_negative": +rawData[1][1],
            "cases_pending_test_results": +rawData[1][2]
        }
    }
}

module.exports = Scraper;