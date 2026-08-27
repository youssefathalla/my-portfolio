import { TestBed } from '@angular/core/testing';
import { DistanceService } from './distance.service';
import { GoogleMapsLoaderService } from './google-maps-loader.service';
import { vi } from 'vitest';

describe('DistanceService', () => {
  let service: DistanceService;
  let mockMapsLoader: unknown;
  let computeRouteMatrixSpy: unknown;

  beforeEach(() => {
    mockMapsLoader = {
      load: vi.fn().mockResolvedValue(undefined),
    };

    computeRouteMatrixSpy = vi.fn().mockResolvedValue({
      matrix: {
        rows: [
          {
            items: [
              {
                condition: 'ROUTE_EXISTS',
                distanceMeters: 10000,
                durationMillis: 3600000,
              },
            ],
          },
        ],
      },
    });

    globalThis.google = {
      maps: {
        importLibrary: vi.fn().mockResolvedValue({
          RouteMatrix: {
            computeRouteMatrix: computeRouteMatrixSpy,
          },
        }),
        TravelMode: { DRIVING: 'DRIVING' },
      },
    } as unknown as typeof google;

    TestBed.configureTestingModule({
      providers: [DistanceService, { provide: GoogleMapsLoaderService, useValue: mockMapsLoader }],
    });

    service = TestBed.inject(DistanceService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate route successfully', async () => {
    const result = await service.calculateRoute('Origin', 'Destination');
    expect(result).toEqual({ distance: 6.21, duration: 60 });
    expect(computeRouteMatrixSpy).toHaveBeenCalledTimes(1);
    expect(computeRouteMatrixSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        origins: ['Origin'],
        destinations: ['Destination'],
      }),
    );
  });

  it('should call getDistanceMatrix only once for identical consecutive requests after caching is implemented', async () => {
    await service.calculateRoute('A', 'B');
    await service.calculateRoute('A', 'B');

    // It should be called only once due to caching
    expect(computeRouteMatrixSpy).toHaveBeenCalledTimes(1);
    expect(computeRouteMatrixSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        origins: ['A'],
        destinations: ['B'],
      }),
    );
  });

  it('should call getDistanceMatrix again for different requests', async () => {
    await service.calculateRoute('A', 'B');
    await service.calculateRoute('C', 'D');

    expect(computeRouteMatrixSpy).toHaveBeenCalledTimes(2);
    expect(computeRouteMatrixSpy).toHaveBeenCalledWith(
      expect.objectContaining({ origins: ['A'], destinations: ['B'] }),
    );
    expect(computeRouteMatrixSpy).toHaveBeenCalledWith(
      expect.objectContaining({ origins: ['C'], destinations: ['D'] }),
    );
  });
});
