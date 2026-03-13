import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = {
  lat: number;
  lng: number;
};

type ShipperMapProps = {
  customerAddress?: string;
  customerLocation?: LatLng;
};

const DEFAULT_CUSTOMER_LOCATION: LatLng = {
  lat: 10.762622,
  lng: 106.660172,
};

function AutoFitMap({
  shipperLocation,
  customerLocation,
  routePoints,
}: {
  shipperLocation: LatLng | null;
  customerLocation: LatLng;
  routePoints: Array<[number, number]>;
}) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (routePoints.length > 1) {
      map.fitBounds(routePoints, { padding: [30, 30] });
      return;
    }
    if (shipperLocation) {
      map.fitBounds(
        [
          [shipperLocation.lat, shipperLocation.lng],
          [customerLocation.lat, customerLocation.lng],
        ],
        { padding: [30, 30] },
      );
    }
  }, [map, shipperLocation, customerLocation, routePoints]);

  return null;
}

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function ShipperMap({
  customerAddress,
  customerLocation,
}: ShipperMapProps) {
  const [shipperLocation, setShipperLocation] = useState<LatLng | null>(null);
  const [resolvedCustomerLocation, setResolvedCustomerLocation] = useState<LatLng>(
    customerLocation || DEFAULT_CUSTOMER_LOCATION,
  );
  const [routePoints, setRoutePoints] = useState<Array<[number, number]>>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);

  useEffect(() => {
    if (customerLocation) {
      setResolvedCustomerLocation(customerLocation);
      return;
    }
    setResolvedCustomerLocation(DEFAULT_CUSTOMER_LOCATION);
  }, [customerLocation]);

  useEffect(() => {
    if (!customerAddress?.trim() || customerLocation) return;

    const query = encodeURIComponent(`${customerAddress}, Ho Chi Minh City, Vietnam`);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`)
      .then((r) => r.json())
      .then((data: Array<{ lat: string; lon: string }>) => {
        if (!data?.[0]) return;
        setResolvedCustomerLocation({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        });
      })
      .catch(() => {
        setResolvedCustomerLocation(DEFAULT_CUSTOMER_LOCATION);
      });
  }, [customerAddress, customerLocation]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setShipperLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setShipperLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }, []);

  useEffect(() => {
    if (!shipperLocation) {
      setRoutePoints([]);
      setDistanceKm(null);
      setDurationMin(null);
      return;
    }

    const from = `${shipperLocation.lng},${shipperLocation.lat}`;
    const to = `${resolvedCustomerLocation.lng},${resolvedCustomerLocation.lat}`;
    fetch(`https://router.project-osrm.org/route/v1/driving/${from};${to}?overview=full&geometries=geojson`)
      .then((r) => r.json())
      .then((data: any) => {
        const route = data?.routes?.[0];
        if (!route?.geometry?.coordinates) {
          setRoutePoints([]);
          setDistanceKm(null);
          setDurationMin(null);
          return;
        }

        const points = route.geometry.coordinates.map((point: [number, number]) => [point[1], point[0]] as [number, number]);
        setRoutePoints(points);
        setDistanceKm(route.distance ? route.distance / 1000 : null);
        setDurationMin(route.duration ? route.duration / 60 : null);
      })
      .catch(() => {
        setRoutePoints([]);
        setDistanceKm(null);
        setDurationMin(null);
      });
  }, [shipperLocation, resolvedCustomerLocation]);

  const navigateUrl = useMemo(() => {
    return `https://www.google.com/maps/dir/?api=1&destination=${resolvedCustomerLocation.lat},${resolvedCustomerLocation.lng}&travelmode=driving`;
  }, [resolvedCustomerLocation]);

  const openNavigation = () => {
    window.open(navigateUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full">
      <MapContainer
        center={resolvedCustomerLocation}
        zoom={15}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "400px" }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AutoFitMap
          shipperLocation={shipperLocation}
          customerLocation={resolvedCustomerLocation}
          routePoints={routePoints}
        />

        <Marker position={resolvedCustomerLocation} icon={markerIcon}>
          <Popup>Customer</Popup>
        </Marker>

        {shipperLocation && (
          <Marker position={shipperLocation} icon={markerIcon}>
            <Popup>Shipper</Popup>
          </Marker>
        )}

        {routePoints.length > 1 && (
          <Polyline positions={routePoints} pathOptions={{ color: "#00B207", weight: 5 }} />
        )}
      </MapContainer>

      {(distanceKm !== null || durationMin !== null) && (
        <p className="mt-2 text-sm text-gray-600">
          {distanceKm !== null && `Distance: ${distanceKm.toFixed(2)} km`}
          {distanceKm !== null && durationMin !== null && " • "}
          {durationMin !== null && `ETA: ${Math.round(durationMin)} min`}
        </p>
      )}

      <button
        type="button"
        onClick={openNavigation}
        className="mt-3 inline-flex items-center justify-center rounded-md bg-[#00B207] px-4 py-2 text-sm font-semibold text-white hover:bg-[#019a07] transition-colors"
      >
        Navigate
      </button>
    </div>
  );
}
