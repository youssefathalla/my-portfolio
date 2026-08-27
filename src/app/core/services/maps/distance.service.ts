/// <reference types="@types/google.maps" />
import { Injectable, inject } from '@angular/core';
import { GoogleMapsLoaderService } from './google-maps-loader.service';

@Injectable({ providedIn: 'root' })
export class DistanceService {
  readonly #mapsLoader = inject(GoogleMapsLoaderService);

  // Cache to store the promise of the route calculation to avoid redundant API calls
  readonly #cache = new Map<string, Promise<{ distance: number; duration: number } | null>>();

  async calculateRoute(
    origin: string,
    destination: string,
  ): Promise<{ distance: number; duration: number } | null> {
    const cacheKey = `${origin}|${destination}`;

    if (this.#cache.has(cacheKey)) {
      return this.#cache.get(cacheKey)!;
    }

    const routePromise = (async () => {
      await this.#mapsLoader.load();
      const { RouteMatrix } = (await google.maps.importLibrary('routes')) as unknown as {
        RouteMatrix: {
          computeRouteMatrix: (request: unknown) => Promise<any>;
        };
      };
      // Confirmed via browser console testing:
      // - origins/destinations: plain strings (NOT waypoint objects)
      // - fields array is REQUIRED by the JS SDK
      // - response structure is: response.matrix.rows[i].items[j]
      const request: unknown = {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        routingPreference: 'TRAFFIC_AWARE',
        fields: ['condition', 'distanceMeters', 'durationMillis'],
      };

      try {
        const response = await RouteMatrix.computeRouteMatrix(request);

        const element = response?.matrix?.rows?.[0]?.items?.[0];

        if (!element) {
          console.warn(`Routes Matrix: no element returned for "${origin}" → "${destination}"`);
          return null;
        }

        if (element.condition && element.condition !== 'ROUTE_EXISTS') {
          console.warn(
            `Routes Matrix: no route between "${origin}" and "${destination}" (${element.condition})`,
          );
          return null;
        }

        const distanceMiles = (element.distanceMeters || 0) * 0.000621371;
        const durationMin = (element.durationMillis || 0) / 60000;

        return {
          distance: Number(distanceMiles.toFixed(2)),
          duration: Math.ceil(durationMin),
        };
      } catch (err) {
        console.error('Failed to compute route matrix:', err);
        throw err;
      }
    })();

    this.#cache.set(cacheKey, routePromise);

    routePromise.catch(() => {
      // Remove from cache if the promise rejects so subsequent calls can retry
      this.#cache.delete(cacheKey);
    });

    return routePromise;
  }
}
