import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import { removeToken } from '@/lib/cookie.ts';
import { getBaseUrl } from '@/lib/service.ts';

type Response = {
  code: number;
  msg: string;
  data: any;
};

class Http {
  private instance: AxiosInstance;

  constructor() {
    const baseURL = getBaseUrl('http');
    const withCredentials = (import.meta.env.VITE_WITH_CREDENTIALS as string) !== 'false';

    this.instance = axios.create({
      baseURL,
      withCredentials,
      timeout: 60 * 1000
    });

    this.setInterceptors();
  }

  private setInterceptors() {
    this.instance.interceptors.request.use((config) => {
      if (config.headers) {
        config.headers.Accept = 'application/json';
      }

      return config;
    });

    this.instance.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        console.log(error);
        const code = error.response?.status;
        if (code === 401) {
          removeToken();
          window.location.reload();
        }
        return Promise.reject(error);
      }
    );
  }

  public get(url: string, params?: any): Promise<Response> {
    return this.instance.request({
      method: 'get',
      url,
      params
    });
  }

  public post(url: string, data?: any): Promise<Response> {
    return this.instance.request({
      method: 'post',
      url,
      data
    });
  }

  public request(config: AxiosRequestConfig): Promise<Response> {
    return this.instance.request(config);
  }
}

export const http = new Http();
