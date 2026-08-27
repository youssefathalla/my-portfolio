import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggerService);

    // Spy on console methods to verify prefixes and prevent actual console output during tests
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('error', () => {
    it('should call console.error with correct prefix and single message', () => {
      service.error('An error occurred');
      expect(console.error).toHaveBeenCalledWith('🔴 [ERROR] An error occurred');
    });

    it('should call console.error with correct prefix, message, and spread arguments', () => {
      service.error('An error occurred', { detail: 'Network failed' }, 404);
      expect(console.error).toHaveBeenCalledWith(
        '🔴 [ERROR] An error occurred',
        { detail: 'Network failed' },
        404,
      );
    });
  });

  describe('warn', () => {
    it('should call console.warn with correct prefix and single message', () => {
      service.warn('A warning');
      expect(console.warn).toHaveBeenCalledWith('🟠 [WARN] A warning');
    });

    it('should call console.warn with correct prefix, message, and spread arguments', () => {
      service.warn('A warning', [1, 2, 3]);
      expect(console.warn).toHaveBeenCalledWith('🟠 [WARN] A warning', [1, 2, 3]);
    });
  });

  describe('info', () => {
    it('should call console.log with correct prefix and single message', () => {
      service.info('Some info');
      expect(console.log).toHaveBeenCalledWith('🔵 [INFO] Some info');
    });

    it('should call console.log with correct prefix, message, and spread arguments', () => {
      service.info('Some info', 'extra data');
      expect(console.log).toHaveBeenCalledWith('🔵 [INFO] Some info', 'extra data');
    });
  });

  describe('debug', () => {
    it('should call console.debug with correct prefix and single message', () => {
      service.debug('Debug info');
      expect(console.debug).toHaveBeenCalledWith('🟢 [DEBUG] Debug info');
    });

    it('should call console.debug with correct prefix, message, and spread arguments', () => {
      service.debug('Debug info', { var: 'value' });
      expect(console.debug).toHaveBeenCalledWith('🟢 [DEBUG] Debug info', { var: 'value' });
    });
  });
});
