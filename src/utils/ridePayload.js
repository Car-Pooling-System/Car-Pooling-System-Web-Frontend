const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function haversineDistanceKm(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function encodeSignedNumber(num) {
  let sgnNum = num << 1;
  if (num < 0) {
    sgnNum = ~sgnNum;
  }
  let encoded = "";
  while (sgnNum >= 0x20) {
    encoded += String.fromCharCode((0x20 | (sgnNum & 0x1f)) + 63);
    sgnNum >>= 5;
  }
  encoded += String.fromCharCode(sgnNum + 63);
  return encoded;
}

function encodePolyline(points) {
  let prevLat = 0;
  let prevLng = 0;
  let result = "";

  points.forEach((point) => {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);

    result += encodeSignedNumber(lat - prevLat);
    result += encodeSignedNumber(lng - prevLng);

    prevLat = lat;
    prevLng = lng;
  });

  return result;
}

function latLngToGrid(lat, lng, size = 0.05) {
  const latIdx = Math.floor(lat / size + 1e-10);
  const lngIdx = Math.floor(lng / size + 1e-10);
  return `${latIdx}_${lngIdx}`;
}

function makeLinePoints(start, end, pointCount = 24) {
  const points = [];
  for (let i = 0; i <= pointCount; i += 1) {
    const t = i / pointCount;
    points.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    });
  }
  return points;
}

export function buildRouteData({ start, end, startLabel, endLabel }) {
  const points = makeLinePoints(start, end);
  const encodedPolyline = encodePolyline(points);
  const gridsCovered = [...new Set(points.map((p) => latLngToGrid(p.lat, p.lng)))];
  const totalDistanceKm = Number(haversineDistanceKm(start, end).toFixed(2));

  return {
    route: {
      start: {
        name: startLabel,
        location: { type: "Point", coordinates: [start.lng, start.lat] },
        grid: latLngToGrid(start.lat, start.lng),
      },
      end: {
        name: endLabel,
        location: { type: "Point", coordinates: [end.lng, end.lat] },
        grid: latLngToGrid(end.lat, end.lng),
      },
      encodedPolyline,
      gridsCovered,
    },
    metrics: {
      totalDistanceKm,
    },
    preview: {
      distanceKm: totalDistanceKm,
      durationMinutes: Math.max(20, Math.round((totalDistanceKm / 55) * 60)),
    },
  };
}

export function buildRouteDataFromPath({ pathPoints, startLabel, endLabel }) {
  const safePoints = pathPoints.filter(
    (point) =>
      Number.isFinite(point?.lat) &&
      Number.isFinite(point?.lng) &&
      Math.abs(point.lat) <= 90 &&
      Math.abs(point.lng) <= 180,
  );

  if (safePoints.length < 2) {
    return null;
  }

  let totalDistanceKm = 0;
  for (let i = 1; i < safePoints.length; i += 1) {
    totalDistanceKm += haversineDistanceKm(safePoints[i - 1], safePoints[i]);
  }

  const start = safePoints[0];
  const end = safePoints[safePoints.length - 1];

  return {
    route: {
      start: {
        name: startLabel,
        location: { type: "Point", coordinates: [start.lng, start.lat] },
        grid: latLngToGrid(start.lat, start.lng),
      },
      end: {
        name: endLabel,
        location: { type: "Point", coordinates: [end.lng, end.lat] },
        grid: latLngToGrid(end.lat, end.lng),
      },
      encodedPolyline: encodePolyline(safePoints),
      gridsCovered: [...new Set(safePoints.map((point) => latLngToGrid(point.lat, point.lng)))],
    },
    metrics: {
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    },
  };
}
