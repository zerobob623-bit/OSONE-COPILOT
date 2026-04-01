import { ApiKeys } from '../types';

export class TuyaService {
  private static async getAccessToken(keys: ApiKeys) {
    if (!keys.tuyaClientId || !keys.tuyaClientSecret) {
      throw new Error('Tuya Client ID or Secret not configured');
    }

    const region = keys.tuyaRegion || 'us';
    const baseUrl = `https://openapi.tuyacn.com`; // Default to CN or use region mapping
    // Region mapping:
    // us: https://openapi.tuyaus.com
    // eu: https://openapi.tuyaeu.com
    // cn: https://openapi.tuyacn.com
    // in: https://openapi.tuyain.com
    
    const regionUrls: Record<string, string> = {
      us: 'https://openapi.tuyaus.com',
      eu: 'https://openapi.tuyaeu.com',
      cn: 'https://openapi.tuyacn.com',
      in: 'https://openapi.tuyain.com',
    };

    const url = `${regionUrls[region] || regionUrls.us}/v1.0/token?grant_type=1`;
    
    // Note: In a real production app, the signature should be generated server-side.
    // For this applet, we'll implement the signature logic here.
    // Tuya signature requires: t, sign_method, client_id, sign
    
    const t = Date.now().toString();
    const signMethod = 'HMAC-SHA256';
    const str = keys.tuyaClientId + t;
    
    // We need a way to compute HMAC-SHA256 in the browser.
    // We can use the Web Crypto API.
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keys.tuyaClientSecret);
    const msgData = encoder.encode(str);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const sign = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    const response = await fetch(url, {
      headers: {
        'client_id': keys.tuyaClientId,
        'sign': sign,
        't': t,
        'sign_method': signMethod,
      }
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Tuya Auth Error: ${data.msg}`);
    }

    return data.result.access_token;
  }

  static async controlDevice(keys: ApiKeys, deviceId: string, commands: any[]) {
    const token = await this.getAccessToken(keys);
    const region = keys.tuyaRegion || 'us';
    const regionUrls: Record<string, string> = {
      us: 'https://openapi.tuyaus.com',
      eu: 'https://openapi.tuyaeu.com',
      cn: 'https://openapi.tuyacn.com',
      in: 'https://openapi.tuyain.com',
    };
    const baseUrl = regionUrls[region] || regionUrls.us;
    
    const t = Date.now().toString();
    const url = `/v1.0/devices/${deviceId}/commands`;
    
    // Tuya signature for business API requires more complex string:
    // client_id + access_token + t + nonce + stringToSign
    // stringToSign = HTTPMethod + "\n" + Content-SHA256 + "\n" + Headers + "\n" + Url
    
    const body = JSON.stringify({ commands });
    const contentHash = await this.sha256(body);
    
    const stringToSign = [
      'POST',
      contentHash,
      '', // Headers
      url
    ].join('\n');
    
    const signStr = keys.tuyaClientId + token + t + stringToSign;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keys.tuyaClientSecret);
    const msgData = encoder.encode(signStr);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const sign = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    const response = await fetch(`${baseUrl}${url}`, {
      method: 'POST',
      headers: {
        'client_id': keys.tuyaClientId,
        'access_token': token,
        'sign': sign,
        't': t,
        'sign_method': 'HMAC-SHA256',
        'Content-Type': 'application/json',
      },
      body
    });

    return await response.json();
  }

  static async listDevices(keys: ApiKeys) {
    const token = await this.getAccessToken(keys);
    const region = keys.tuyaRegion || 'us';
    const regionUrls: Record<string, string> = {
      us: 'https://openapi.tuyaus.com',
      eu: 'https://openapi.tuyaeu.com',
      cn: 'https://openapi.tuyacn.com',
      in: 'https://openapi.tuyain.com',
    };
    const baseUrl = regionUrls[region] || regionUrls.us;
    
    const t = Date.now().toString();
    const url = `/v1.0/devices`; // This might need a user ID or specific query
    // Actually, listing all devices for a project:
    // /v1.0/iot-01/devices
    
    const stringToSign = [
      'GET',
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Empty body hash
      '', // Headers
      url
    ].join('\n');
    
    const signStr = keys.tuyaClientId + token + t + stringToSign;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keys.tuyaClientSecret);
    const msgData = encoder.encode(signStr);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const sign = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    const response = await fetch(`${baseUrl}${url}`, {
      headers: {
        'client_id': keys.tuyaClientId,
        'access_token': token,
        'sign': sign,
        't': t,
        'sign_method': 'HMAC-SHA256',
      }
    });

    return await response.json();
  }

  private static async sha256(message: string) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
