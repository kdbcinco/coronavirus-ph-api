const cheerio = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');
const axios = require('axios');
const { toIS08601 } = require('../utils');

const URL = 'https://en.wikipedia.org/wiki/2020_coronavirus_pandemic_in_the_Philippines';

class Scraper {
  async getHTML() {
    try {
      const res = await axios(URL);
      return cheerio.load(res.data);
    } catch (e) {
      throw new Error("Can't fetch url.");
    }
  }
  
  async getCases() {
    const $ = await this.getHTML();
    cheerioTableparser($);
    const rawData = $('.wikitable').first().parsetable(true, true, true);

    const model = (caseNo) => ({
      "case_no": caseNo,
      "date": "TBA",
      "age": "TBA",
      "gender": "TBA",
      "nationality": "TBA",
      "hospital_admitted_to": "TBA",
      "had_recent_travel_history_abroad": "TBA",
      "status": "TBA",
      "notes": "TBA"
    })
    
    const formattedData = [];

    // Infobox confirmed cases
    const confirmedCases = $('.infobox tbody tr th:contains("Confirmed cases")').next().text(); 
    
    rawData[0].forEach((item, idx) => {
      if (idx === 0) return;

      // Check if last row has hyphen meaning it's TBA
      if (item.includes('–')) {
        if (+confirmedCases > formattedData.length) {
          const diff = +confirmedCases - formattedData.length;
          for (let x = 0; x < diff; x++) {
            formattedData.push(model(formattedData.length + 1));
          }
        }

        return;
      }
      
      const obj = {
        "case_no": +item,
        "date": toIS08601(`${rawData[1][idx]}, 2020`),
        "age": +rawData[2][idx],
        "gender": rawData[3][idx],
        "nationality": rawData[4][idx],
        "hospital_admitted_to": rawData[5][idx],
        "had_recent_travel_history_abroad": rawData[6][idx],
        "status": rawData[7][idx],
        "notes": rawData[8][idx]
      };
      
      formattedData.push(obj);
    });

    // We do this because infobox confirmed cases
    // get updated quickly but the table hasn't
    if (+confirmedCases > formattedData.length) {
      const diff = +confirmedCases - formattedData.length;
      for (let x = 0; x < diff; x++) {
        formattedData.push(model(formattedData.length + 1));
      }
    }
    
    return formattedData;
  }
  
  async getCasesOutsidePh() {
    const $ = await this.getHTML();
    cheerioTableparser($);
    const rawData = $('.wikitable').eq(1).parsetable(true, true, true);
    
    const formattedData = [];
    
    rawData[0].forEach((item, idx) => {
      const skip = [0, rawData[0].length - 1, rawData[0].length - 2]
      if (skip.includes(idx)) return;
      
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
  
  async getPatientsUnderInvestigation() {
    const $ = await this.getHTML();
    cheerioTableparser($);
    const rawData = $('.wikitable').eq(4).parsetable(true, true, true);
    
    const formattedData = [];
    
    rawData[0].forEach((item, idx) => {
      const skip = [0, 1, 2, rawData[0].length - 1, rawData[0].length - 2, rawData[0].length - 3];
      if (skip.includes(idx)) return;
      
      const obj = {
        "region": item,
        "current_pui_status": {
          "suspected_cases": {
            "admitted": +rawData[1][idx],
            "deaths": +rawData[2][idx]
          },
          "confirmed_cases": {
            "admitted": +rawData[3][idx],
            "recoveries": +rawData[4][idx],
            "deaths": +rawData[5][idx],
          }
        },
        "total": 0
      };
      
      for (let x = 1; x <= 5; x++) {
        obj.total += +rawData[x][idx];
      }
      
      formattedData.push(obj);
    });
    
    return formattedData;
  }
}

module.exports = Scraper;