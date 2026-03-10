/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

export interface CoordinatesWithDistance {
    _id: string;
    zoneName: string;
    shippingRate: number;
    description?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    addressCount?: number;
    distance?: number;
}

/**
 * Sort zones by distance from current location
 */
export function sortByDistance(
    zones: CoordinatesWithDistance[],
    currentLat: number,
    currentLon: number
): CoordinatesWithDistance[] {
    return zones
        .map((zone) => {
            if (zone.coordinates?.latitude && zone.coordinates?.longitude) {
                const distance = calculateDistance(
                    currentLat,
                    currentLon,
                    zone.coordinates.latitude,
                    zone.coordinates.longitude
                );
                return { ...zone, distance };
            }
            return { ...zone, distance: Infinity }; // Zones without coordinates go to the end
        })
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
}
