import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import https from 'https';
import crypto from 'crypto';

import { config as dotenv } from "dotenv";
import { BullhornApi } from './lib/bullhorn';
import MockAdapter from "axios-mock-adapter";

dotenv();

const userId = "5";
const candidateId = "505";

const applyRetryWrapper = (axios: AxiosInstance) => {
  axiosRetry(axios, {
    retries: 3,
    retryDelay(retryCount) {
      console.log('RETRY ATTEMPT NUMBER: ', retryCount);
      return 1000; // Retry request every 1000 milliseconds
    },
    retryCondition(error) {
      switch (error.response?.status) {
        case 429:
        case 500:
        case 503:
          return true; // Retry request with response status code 429
        default:
          return false;
      }
    },
  });
}

const runAuthCode = (bullhorn: BullhornApi) => bullhorn.getAuthCode({
  username: process.env.BULLHORN_USER || "",
  password: process.env.BULLHORN_PASSWORD || ""
});

const testAuthCode = async (bullhorn: BullhornApi) => {
  const code = await runAuthCode(bullhorn);

  // console.log("Auth Code: ", code);

  // note: this could be ammended with a regex pattern for their codes
  expect(code.length).toBeGreaterThan(10);
};

const testAccessToken = async (bullhorn: BullhornApi) => {
  // const code = await runAuthCode(bullhorn);
  const token = await bullhorn.getAccessToken();

  // console.log("Access Token: ", token);

  // note: this could be ammended with a regex pattern for their codes
  expect(token.length).toBeGreaterThan(10);
};

const testRestToken = async (bullhorn: BullhornApi) => {
  // const code = await runAuthCode(bullhorn);
  // const token = await bullhorn.getAccessToken(code);
  const { restUrl, BhRestToken } = await bullhorn.getRestToken();

  // console.log("Rest Url: ", restUrl)
  // console.log("Rest Token: ", BhRestToken);

  expect(BhRestToken?.length).toBeGreaterThan(10);
  expect(restUrl?.length).toBeGreaterThan(10);
};

const testVitalCandidateData = async (bullhorn: BullhornApi) => {
  // const code = await runAuthCode(bullhorn);
  // const token = await bullhorn.getAccessToken(code);
  // const { restUrl, BhRestToken } = await bullhorn.getRestToken(token);

  const data = await bullhorn.getCandidateEmailFirstLastNameSSNDOB(candidateId);

  expect(data).toHaveProperty("email");
  expect(data).toHaveProperty("ssn");
};

const testCandidateData = async (bullhorn: BullhornApi) => {
  const data = await bullhorn.getCandidate(candidateId);

  expect(data).toHaveProperty("email");
  expect(data).toHaveProperty("id");
};

const testCandidateWorkHistory = async (bullhorn: BullhornApi) => {
  const data = await bullhorn.getCandidateWorkHistory(candidateId);

  expect(Array.isArray(data)).toBe(true);
};

const testCandidateEducationHistory = async (bullhorn: BullhornApi) => {
  const data = await bullhorn.getCandidateEducationHistory(candidateId);

  expect(Array.isArray(data)).toBe(true);
};

const testCorpUserData = async (bullhorn: BullhornApi) => {
  const data = await bullhorn.getUserData("5");

  expect(data).toHaveProperty("email");
};

const testParallelRequests = async (bullhorn: BullhornApi) => {
  const results = await Promise.all([
    testCandidateData(bullhorn),
    testCandidateEducationHistory(bullhorn),
    testCandidateWorkHistory(bullhorn)
  ]);
  expect(Array.isArray(results)).toBe(true);
}

const testLogout = async (bullhorn: BullhornApi) => {
  const status = await bullhorn.logout();
  expect(status).toBe(200);
}

const urlRegex = new RegExp(`^https://.*?(${process.env.BULLHORN_DOMAIN})`, "i");

describe("Legacy Axios - Bullhorn API", () => {
  let axiosInstance: AxiosInstance;
  let bullhorn: BullhornApi;

  beforeAll(() => {
    axiosInstance = axios.create({
      httpsAgent: new https.Agent({
        // for self signed you could also add
        // rejectUnauthorized: false,

        // allow legacy server
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
      }),
    });


    // const mock = new MockAdapter(axiosInstance);
    // mock.onPost(urlRegex).timeoutOnce();
    // mock.onPost(/.*/).networkErrorOnce();

    applyRetryWrapper(axiosInstance);
    bullhorn = new BullhornApi(axiosInstance);
  });

  test('should respond with Auth code', () => testAuthCode(bullhorn));
  test('should respond with Access Token after Auth code', () => testAccessToken(bullhorn));
  test('should respond with Rest Token after Access Token', () => testRestToken(bullhorn));
  test(`should respond with User Data (${userId})`, () => testCorpUserData(bullhorn));
  test(`should respond with Candidate Vital Data (${candidateId}`, () => testVitalCandidateData(bullhorn));
  test(`should respond with Candidate Entity Data (${candidateId})`, () => testCandidateData(bullhorn));
  test(`should respond with Candidate Work History (${candidateId})`, () => testCandidateWorkHistory(bullhorn));
  test(`should respond with Candidate Education History (${candidateId})`, () => testCandidateEducationHistory(bullhorn));
  test(`should respond running Parallel Requests: Candidate, Education history, Work history (${candidateId})`, () => testParallelRequests(bullhorn));
  test(`should logout with 200 status code`, () => testLogout(bullhorn));
});


describe("Standard Axios - Bullhorn API", () => {
  let axiosInstance: AxiosInstance;
  let bullhorn: BullhornApi;

  beforeAll(() => {
    axiosInstance = axios.create();
    applyRetryWrapper(axiosInstance);

    bullhorn = new BullhornApi(axiosInstance);
  });

  test('should respond with Auth code', () => testAuthCode(bullhorn));
  test('should respond with Access Token after Auth code', () => testAccessToken(bullhorn));
  test('should respond with Rest Token after Access Token', () => testRestToken(bullhorn));
  test(`should respond with User Data (${userId})`, () => testCorpUserData(bullhorn));
  test(`should respond with Candidate Vital Data (${candidateId}`, () => testVitalCandidateData(bullhorn));
  test(`should respond with Candidate Entity Data (${candidateId})`, () => testCandidateData(bullhorn));
  test(`should respond with Candidate Work History (${candidateId})`, () => testCandidateWorkHistory(bullhorn));
  test(`should respond with Candidate Education History (${candidateId})`, () => testCandidateEducationHistory(bullhorn));
  test(`should respond running Parallel Requests: Candidate, Education history, Work history (${candidateId})`, () => testParallelRequests(bullhorn));
  test(`should logout with 200 status code`, () => testLogout(bullhorn));
});