const app = require('./server');
const supertest = require('supertest');

const request = supertest(app);

describe('GET /cases', () => {

  it('response with json containing a list of all cases', async (done) => {
    const response = await request.get('/cases');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array)
    expect(response.body[0]).toMatchSnapshot({
      case_no: expect.any(Number),
      date: expect.any(String),
      age: expect.any(Number),
      gender: expect.any(String),
      nationality: expect.any(String),
      hospital_admitted_to: expect.any(String),
      had_recent_travel_history_abroad: expect.any(String),
      status: expect.any(String),
      other_information: expect.any(String),
    });
    done();
  });

});

describe('GET /cases-outside-ph', () => {

  it('response with json containing a list of all cases outside ph', async (done) => {
    const response = await request.get('/cases-outside-ph');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array)
    expect(response.body[0]).toMatchSnapshot({
      country_territory_place: expect.any(String),
      confirmed: expect.any(Number),
      recovered: expect.any(Number),
      died: expect.any(Number),
    });
    done();
  });

});

describe('GET /patients-under-investigation', () => {

  it('response with json containing a list of all patients under investigation', async (done) => {
    const response = await request.get('/patients-under-investigation');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array)
    expect(response.body[0]).toMatchSnapshot({
      region: expect.any(String),
      local_government_unit: expect.any(String),
      current_pui_status: {
        confirmed_cases: {
          admitted: expect.any(Number),
          recoveries: expect.any(Number),
          deaths: expect.any(Number)
        }
      },
      total: expect.any(Number)
    });
    done();
  });

});

describe('GET /test-results', () => {

  it('response with json containing case summary by test results', async (done) => {
    const response = await request.get('/suspected-cases');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('confirmed_cases');
    expect(response.body).toHaveProperty('cases_tested_negative');
    expect(response.body).toHaveProperty('cases_pending_test_results');
    expect(response.body).toMatchSnapshot({
      confirmed_cases: expect.any(Number),
      cases_tested_negative: expect.any(Number),
      cases_pending_test_results: expect.any(Number)
    });
    done();
  });

});

describe('GET /mm-checkpoints', () => {

  it('response with json containing a list of Metro Manila Community Quarantine Checkpoints', async (done) => {
    const response = await request.get('/mm-checkpoints');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array)
    expect(response.body[0]).toMatchSnapshot({
      id: expect.any(Number),
      district: expect.any(String),
      city: expect.any(String),
      location: expect.any(String),
      type: expect.any(String),
      lat: expect.any(Number),
      lng: expect.any(Number),
      description: expect.any(String)
    });
    done();
  });

});

describe('GET /mm-checkpoints/:id', () => {

  it('response with json containing a single Metro Manila Community Quarantine Checkpoint', async (done) => {
    const response = await request.get('/mm-checkpoints/13');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Object)
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('district');
    expect(response.body).toHaveProperty('city');
    expect(response.body).toHaveProperty('location');
    expect(response.body).toHaveProperty('type');
    expect(response.body).toHaveProperty('lat');
    expect(response.body).toHaveProperty('lng');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toMatchSnapshot({
      id: expect.any(Number),
      district: expect.any(String),
      city: expect.any(String),
      location: expect.any(String),
      type: expect.any(String),
      lat: expect.any(Number),
      lng: expect.any(Number),
      description: expect.any(String)
    });
    done();
  });

});