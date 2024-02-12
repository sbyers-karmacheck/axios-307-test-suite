import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

interface IBullhornCreds {
  username: string;
  password: string;
}

interface IBullhornRestTokenResponse {
  restUrl?: string;
  BhRestToken?: string;
}

export class BullhornApi {
  private axios: AxiosInstance;
  private authCode: string = "";
  private accessToken: string = "";
  private restTokenData: IBullhornRestTokenResponse = {};

  constructor(axios: AxiosInstance) {
    this.axios = axios;
  }

  private restRequest<T>(config: AxiosRequestConfig, params: { [key: string]: string }): Promise<AxiosResponse<T>> {
    const {
      BhRestToken,
      restUrl
    } = this.restTokenData;

    if (!BhRestToken || !restUrl) throw new Error("Missing rest token data; re-auth required.");

    params.BhRestToken = BhRestToken;
    config.url = `${restUrl}${config.url}`;
    config.params = params;

    return this.axios.request<T>(config);
  }

  public async getAuthCode({ username, password }: IBullhornCreds): Promise<string> {
    const config: AxiosRequestConfig = {
      method: 'POST',
      url: `https://auth.${process.env.BULLHORN_DOMAIN}/oauth/authorize`,
      params: {
        response_type: 'code',
        action: 'Login',
        username,
        password,
        client_id: process.env.BULLHORN_CLIENT_ID,
      },
    };

    const {
      request: {
        res: {
          responseUrl
        }
      }
    } = await this.axios.request(config);

    this.authCode = new URL(responseUrl).searchParams.get('code') || "";

    return this.authCode;
  }

  public async getAccessToken(): Promise<string> {
    if (!this.authCode) throw new Error("No auth code for token acquisition; bailing out.");

    const params = {
      grant_type: 'authorization_code',
      code: this.authCode,
      client_id: process.env.BULLHORN_CLIENT_ID,
      client_secret: process.env.BULLHORN_CLIENT_SECRET,
    };

    const config: AxiosRequestConfig = {
      method: 'POST',
      url: `https://auth.${process.env.BULLHORN_DOMAIN}/oauth/token`,
      params,
    };

    const { data } = await this.axios.request(config);

    this.accessToken = data?.access_token;

    return this.accessToken;
  }

  public async getRestToken(): Promise<IBullhornRestTokenResponse> {
    if (!this.accessToken) throw new Error("No access token for rest token acquisition; bailing out.");

    const params = {
      version: '*',
      access_token: this.accessToken,
    };

    const config: AxiosRequestConfig = {
      method: 'POST',
      url: `https://rest.${process.env.BULLHORN_DOMAIN}/rest-services/login`,
      params,
    };

    const { data } = await this.axios.request<IBullhornRestTokenResponse>(config);
    this.restTokenData = data;

    return this.restTokenData;
  }

  public async getCandidateEmailFirstLastNameSSNDOB(entityId: string): Promise<any> {
    const {
      data: {
        data
      }
    } = await this.restRequest<any>({
      method: 'GET',
      url: `entity/Candidate/${entityId}`
    }, {
      fields: 'email,firstName,lastName,ssn,dateOfBirth'
    });

    return data;
  }

  public async getUserData(entityId: string): Promise<any> {
    const {
      data: {
        data
      }
    } = await this.restRequest<any>({
      method: 'GET',
      url: `entity/CorporateUser/${entityId}`
    }, {
      fields: 'email,firstName,lastName,userType'
    });

    return data;
  }

  public async getCandidate(entityId: string): Promise<any> {
    const {
      data: {
        data
      }
    } = await this.restRequest<any>({
      method: 'GET',
      url: `entity/Candidate/${entityId}`
    }, {
      fields: 'firstName,lastName,email,address,id,phone,phone2,phone3,mobile',
    });

    return data;
  }

  public async getCandidateWorkHistory(entityId: string): Promise<any[]> {
    const {
      data: {
        data
      }
    } = await this.restRequest<any>({
      method: 'GET',
      url: `query/CandidateWorkHistory`
    }, {
      where: `candidate.id=${entityId}`,
      fields: 'id,title,salaryType,salary1,salary2,startDate,endDate,bonus,commission,companyName,comments,isDeleted',
    });

    return data;
  }

  public async getCandidateEducationHistory(entityId: string) {
    const {
      data: {
        data
      }
    } = await this.restRequest<any>({
      method: 'GET',
      url: `query/CandidateEducation`
    }, {
      where: `candidate.id=${entityId}`,
      fields: 'id,city,degree,major,gpa,state,school,endDate,graduationDate,startDate,comments,expirationDate,certification,isDeleted',
    });

    return data;
  }

  async logout(): Promise<number> {
    const {
      status
    } = await this.restRequest<any>({
      method: 'POST',
      url: `logout`
    }, {});

    return status;
  }
}