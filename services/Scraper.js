const cheerio = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');
const axios = require('axios');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { toIS08601 } = require('../utils');
require('dotenv').config();

const URL = 'https://en.wikipedia.org/wiki/2020_coronavirus_pandemic_in_the_Philippines';

const sheetId = '1wdxIwD0b58znX4UrH6JJh_0IhnZP0YWn23Uqs7lHB6Q';
const doc = new GoogleSpreadsheet(sheetId);

// Get from GOOGLE
doc.useApiKey(process.env.DOC_API_KEY);

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
    await doc.loadInfo();
    
    // Main database from reddit
    const firstSheet = doc.sheetsByIndex[0];
    await firstSheet.loadHeaderRow();
    
    const rows = await firstSheet.getRows({
      offset: 1
    });

    const formattedData = [];

    const addTBA = (val) => val === '?' || typeof val === 'undefined' ? "TBA" : val;

    rows.forEach((row) => {
      formattedData.push({
        "case_no": +row['Case #'],
        "date": row['Tested Positive'] === 'For Validation' ? 'For Validation' : toIS08601(`${row['Tested Positive']}, 2020`),
        "age": +row.Age,
        "gender": addTBA(row['Sex']),
        "nationality": addTBA(row['Nationality']),
        "hospital_admitted_to": addTBA(row['Medical Facility Admitted/Consulted']),
        "had_recent_travel_history_abroad": addTBA(row['Travel History']),
        "resident_of": addTBA(row['Resident of']),
        "status": addTBA(row['Status']) !== 'TBA' ? row['Status'].split(' ')[0] : 'TBA',
        "other_information": addTBA(row['Other Information']),
        "source": addTBA(row['Source (Press Release of DOH)'])
      });
    });
    
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