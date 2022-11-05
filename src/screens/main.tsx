import * as React from "react";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { StyleSheet, View, Dimensions } from "react-native";
import {
  Button,
  HStack,
  Spinner,
  Heading,
  useToast,
  IconButton,
} from "native-base";

import http from "../services/http";

export default function Main() {
  const Toast = useToast();
  const [markers, setMarkers] = useState([] as any);
  const [location, setLocation] = useState([] as any);

  // Function to build Google Maps URL to sorted route
  const routeRequest = async () => {
    // Get coordinates of all markers
    let coords = markers.map((marker: any) => [
      marker.latlng.longitude,
      marker.latlng.latitude,
    ]);

    // Add current location to beginning of array
    coords.unshift([location.longitude, location.latitude]);

    // Stringify coordinates to be used in OSRM API
    const coordsString = coords.map((coord: any) => coord.join(",")).join(";");

    // OSRM API request
    http
      .get(`trip/v1/car/${coordsString}?annotations=false`)
      .then(async (res) => {
        // Get waypoints from response and sort them by waypoint_index
        const sortedWaypoints = await res.data.waypoints.sort(
          (a: any, b: any) => a.waypoint_index - b.waypoint_index
        );

        // Get only the coordinates of the sorted waypoints and reverse them(lnglat to latlng)
        const sortedCoords = await sortedWaypoints.map((coord: any) =>
          coord.location.reverse()
        );

        // Set origin and destination
        const origin = sortedCoords[0];
        const destination = sortedCoords[sortedCoords.length - 1];

        // Build Google Maps URL only with origin and destination
        let finalUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&dir_action=navigate`;

        // If there are more than 2 waypoints, add them to the URL
        if (sortedCoords.length > 2) {
          // Remove origin and destination from sortedCoords
          sortedCoords.pop();
          sortedCoords.shift();

          // Prepare waypoints for Google Maps URL
          const waypoints = sortedCoords
            .map((coord: any) => coord.join(","))
            .join("|");

          // Add waypoints to Google Maps URL
          finalUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&waypoints=${waypoints}&destination=${destination}&travelmode=driving&dir_action=navigate`;
        }

        // Open Google Maps with sorted route
        Linking.openURL(finalUrl);
      });
  };

  // Gets user location and sets it to state
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let { longitude, latitude } = await (
        await Location.getCurrentPositionAsync({})
      ).coords;
      setLocation({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  // Loading component
  const Loading = () => (
    <HStack space={2}>
      <Spinner accessibilityLabel="Loading posts" />
      <Heading fontSize="md">Loading</Heading>
    </HStack>
  );

  return (
    <View style={styles.container}>
      {location.latitude ? (
        <>
          <MapView
            showsUserLocation
            style={styles.map}
            initialRegion={location}
            showsMyLocationButton={false}
            onPress={(e) =>
              setMarkers([...markers, { latlng: e.nativeEvent.coordinate }])
            }
          >
            {markers.map((marker: any, index: number) => (
              <Marker key={index} coordinate={marker.latlng} />
            ))}
          </MapView>

          <HStack space={3} position="absolute" bottom={6}>
            <Button
              size="lg"
              width={Dimensions.get("window").width - 92}
              onPress={() => {
                if (markers.length > 1) routeRequest();
                else
                  Toast.show({
                    placement: "top",
                    description: "Selecione pelo menos 2 pontos no mapa!",
                  });
              }}
            >
              GERAR ROTA
            </Button>
            <IconButton
              variant="solid"
              _icon={{
                as: AntDesign,
                name: "close",
              }}
              onPress={() => setMarkers([])}
            />
          </HStack>
        </>
      ) : (
        <Loading />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height + 56,
  },
});
