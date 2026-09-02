import { environment as devEnvironment } from './environment';
import { environment as prodEnvironment } from './environment.prod';

describe('environment (development)', () => {
  it('has production set to false', () => {
    expect(devEnvironment.production).toBe(false);
  });

  it('has baseUrl set to the local dev-server origin', () => {
    expect(devEnvironment.baseUrl).toBe('http://localhost:4200');
  });
});

describe('environment.prod', () => {
  it('has production set to true', () => {
    expect(prodEnvironment.production).toBe(true);
  });

  it('has baseUrl set to the purchased production domain', () => {
    expect(prodEnvironment.baseUrl).toBe('https://youssefathalla.com');
  });
});

describe('dev vs prod baseUrl split', () => {
  it('resolves to different baseUrl values between the two environments', () => {
    expect(devEnvironment.baseUrl).not.toBe(prodEnvironment.baseUrl);
  });
});
