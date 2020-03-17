const app = require('./server');
const supertest = require('supertest');

const request = supertest(app);

describe('GET /cases', () => {
  
  it('response with json containing a list of all cases', async (done) => {
    const response = await request.get('/cases');
    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).toMatch(JSON.stringify({
      case_no: 30,
      date: "2020-03-10",
      age: 96,
      gender: "Female",
      nationality: "Filipino",
      hospital_admitted_to: "The Medical City",
      had_recent_travel_history_abroad: "No",
      status: "Admitted",
      notes: "Relative of Case No. 5 and wife of Case No. 28; asymptomatic."
    }))
    done();
  });
  
});

describe('GET /cases-outside-ph', () => {
  
  it('response with json containing a list of all cases outside ph', async (done) => {
    const response = await request.get('/cases-outside-ph');
    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).toMatch(JSON.stringify({
      country_territory_place: "Diamond Princess",
      confirmed: 80,
      recovered: 76,
      died: 0
    }))
    done();
  });
  
});

describe('GET /patients-under-investigation', () => {
  
  it('response with json containing a list of all patients under investigation', async (done) => {
    const response = await request.get('/patients-under-investigation');
    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).toMatch(JSON.stringify({
      region: "Metro Manila (NCR)",
      current_pui_status: {
        suspected_cases: {
          admitted: 80,
          deaths: 1
        },
        confirmed_cases: {
          admitted: 117,
          recoveries: 1,
          deaths: 9
        }
      },
      total: 208
    }))
    done();
  });
  
});

describe('GET /suspected-cases', () => {
  
  it('response with json containing suspected cases', async (done) => {
    const response = await request.get('/suspected-cases');
    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).toMatch(JSON.stringify({
      confirmed_cases: 142,
      cases_tested_negative: 638,
      cases_pending_test_results: 72
    }))
    done();
  });
  
});