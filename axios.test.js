const axios = require('axios');
const express = require('express');
const http = require('http');

let server;
const port = 3000;

beforeAll(done => {
    const app = express();

    // enable body parsing middleware
    express.json();

    // Mock endpoint that redirects
    app.get('/redirect', (req, res) => {
        res.redirect(307, '/new-location');
    });

    // Target endpoint of the redirect
    app.get('/new-location', (req, res) => {
        res.send('New Location');
    });

    // Mock POST endpoint that redirects
    app.post('/redirect-post', (req, res) => {
        res.redirect(307, '/new-location-post');
    });

    // Target POST endpoint of the redirect
    app.post('/new-location-post', express.json(), (req, res) => {
        res.json(req.body);  // Echo back the received data
    });

    server = http.createServer(app).listen(port, done);
});

afterAll(done => {
    server.close(done);
});

let host = `http://localhost:${port}`;

test('Axios should follow 307 redirect for GET request', async () => {
    const { data } = await axios.get(`${host}/redirect`);
    expect(data).toBe('New Location');
});

test('Axios should follow 307 redirect for POST and maintain data', async () => {
    const testData = { key: 'value' };
    const response = await axios.post(`${host}/redirect-post`, testData);

    expect(response.data).toEqual(testData);
});

