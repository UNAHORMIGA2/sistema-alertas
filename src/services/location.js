import * as Location from "expo-location";

export async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Permiso de ubicacion denegado");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  };
}

export async function startLocationUpdates(onUpdate, interval = 10000) {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Permiso de ubicacion denegado");
  }

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: interval,
      distanceInterval: 10,
    },
    (location) => {
      onUpdate({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    },
  );
}
