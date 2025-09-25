import { BASE_URL, WEATHER_API_KEY } from "@/utils";
import axios from "axios";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
}

interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
}

interface ForecastData {
  list: ForecastItem[];
}

const formatDateTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return {
    date: date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    time: date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

type ForecastSort = "date" | "temp";

export default function Index() {
  const { width, height } = useWindowDimensions();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<ForecastSort>("date");

  const isLandscape = width > height;

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setPermissionDenied(false);
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const nowResp = await axios.get(`${BASE_URL}/weather`, {
        params: { lat, lon, appid: WEATHER_API_KEY, units: "metric" },
      });

      setWeatherData(nowResp.data);

      const fResp = await axios.get(`${BASE_URL}/forecast`, {
        params: { lat, lon, appid: WEATHER_API_KEY, units: "metric" },
      });

      setForecastData(fResp.data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshWeather = useCallback(async () => {
    if (location) {
      setRefreshing(true);
      await fetchWeather(location.coords.latitude, location.coords.longitude);
    }
  }, [location]);

  const getWeatherIcon = (iconCode: string) =>
    `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather(location.coords.latitude, location.coords.longitude);
    }
  }, [location]);

  const filteredForecast = useMemo(() => {
    if (!forecastData?.list) return [];
    const listCopy = [...forecastData.list];
    if (sortBy === "date") {
      listCopy;
    } else if (sortBy === "temp") {
      listCopy.sort((a, b) => b.main.temp - a.main.temp);
    }
    return listCopy;
  }, [forecastData, sortBy]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Getting weather data...</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Text style={[styles.errorText, { marginTop: 0 }]}>
          Location permission is required to fetch weather data.
        </Text>
        <Text style={[styles.errorText, { fontSize: 14, marginTop: 10 }]}>
          Please enable location services in your device settings and try again.
        </Text>
      </View>
    );
  }

  if (!weatherData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to load weather data</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshWeather} />
      }
    >
      {isLandscape ? (
        <View style={styles.landscapeContainer}>
          <View style={styles.landscapeLeftPanel}>
            <Text style={[styles.location, { fontSize: 24 }]}>
              {weatherData.name}
            </Text>
            <Text style={[styles.temperature, { fontSize: 60 }]}>
              {Math.round(weatherData.main.temp)}°
            </Text>
            <Text style={[styles.description, { fontSize: 16 }]}>
              {weatherData.weather[0].description}
            </Text>
            <Image
              source={{ uri: getWeatherIcon(weatherData.weather[0].icon) }}
              style={[styles.weatherIcon, { width: 80, height: 80 }]}
            />
          </View>
          <View style={styles.landscapeRightPanel}>
            <View
              style={[styles.weatherDetails, styles.landscapeWeatherDetails]}
            >
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Feels like</Text>
                <Text style={styles.detailValue}>
                  {Math.round(weatherData.main.feels_like)}°
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>
                  {weatherData.main.humidity}%
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Wind</Text>
                <Text style={styles.detailValue}>
                  {weatherData.wind.speed} m/s
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.currentWeather}>
          <Text style={styles.location}>{weatherData.name}</Text>
          <Text style={styles.temperature}>
            {Math.round(weatherData.main.temp)}°
          </Text>
          <Text style={styles.description}>
            {weatherData.weather[0].description}
          </Text>
          <Image
            source={{ uri: getWeatherIcon(weatherData.weather[0].icon) }}
            style={styles.weatherIcon}
          />
          <View style={styles.weatherDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Feels like</Text>
              <Text style={styles.detailValue}>
                {Math.round(weatherData.main.feels_like)}°
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Humidity</Text>
              <Text style={styles.detailValue}>
                {weatherData.main.humidity}%
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Wind</Text>
              <Text style={styles.detailValue}>
                {weatherData.wind.speed} m/s
              </Text>
            </View>
          </View>
        </View>
      )}
      {forecastData && (
        <View
          style={[styles.forecastSection, isLandscape && { paddingTop: 10 }]}
        >
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>
          <View style={styles.sortControls}>
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortBy === "date" && styles.sortButtonActive,
              ]}
              onPress={() => setSortBy("date")}
            >
              <Text
                style={[
                  styles.sortText,
                  sortBy === "date" && styles.sortTextActive,
                ]}
              >
                Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortBy === "temp" && styles.sortButtonActive,
              ]}
              onPress={() => setSortBy("temp")}
            >
              <Text
                style={[
                  styles.sortText,
                  sortBy === "temp" && styles.sortTextActive,
                ]}
              >
                Temperature
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredForecast}
            keyExtractor={(item) => item.dt.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const dateTime = formatDateTime(item.dt);
              return (
                <View style={styles.forecastItem}>
                  <Text style={styles.forecastDate}>{dateTime.date}</Text>
                  <Text style={styles.forecastTime}>{dateTime.time}</Text>
                  <Image
                    source={{ uri: getWeatherIcon(item.weather[0].icon) }}
                    style={styles.forecastIcon}
                  />
                  <Text style={styles.forecastTemp}>
                    {Math.round(item.main.temp)}°
                  </Text>
                  <Text style={styles.forecastDescription}>
                    {item.weather[0].main}
                  </Text>
                </View>
              );
            }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#30B4E0" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#30B4E0",
  },
  loadingText: { color: "#ffffff", fontSize: 16, marginTop: 10 },
  errorText: {
    color: "#ffffff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
  },
  landscapeContainer: { flexDirection: "row", flex: 1, paddingTop: 20 },
  landscapeLeftPanel: {
    flex: 0.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  landscapeRightPanel: {
    flex: 0.5,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  landscapeWeatherDetails: { flexDirection: "column" },
  currentWeather: { alignItems: "center", padding: 20, paddingTop: 60 },
  location: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "300",
    marginBottom: 5,
  },
  temperature: { color: "#ffffff", fontSize: 72, fontWeight: "200" },
  description: {
    color: "#ffffff",
    fontSize: 18,
    textTransform: "capitalize",
    marginBottom: 10,
  },
  weatherIcon: { width: 100, height: 100 },
  weatherDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    padding: 15,
  },
  detailItem: { alignItems: "center", marginBottom: 10 },
  detailLabel: {
    color: "#ffffff",
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 5,
  },
  detailValue: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  forecastSection: { padding: 20 },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
  },
  sortControls: {
    flexDirection: "row",
    marginBottom: 12,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
  },
  sortButtonActive: {
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  sortText: {
    color: "#ffffff",
    fontSize: 13,
  },
  sortTextActive: {
    fontWeight: "700",
  },
  forecastItem: {
    alignItems: "center",
    marginRight: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    padding: 12,
    minWidth: 85,
  },
  forecastDate: {
    color: "#ffffff",
    fontSize: 11,
    marginBottom: 2,
    fontWeight: "500",
  },
  forecastTime: {
    color: "#ffffff",
    fontSize: 10,
    marginBottom: 5,
    opacity: 0.8,
  },
  forecastIcon: { width: 35, height: 35 },
  forecastTemp: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 3,
  },
  forecastDescription: {
    color: "#ffffff",
    fontSize: 9,
    marginTop: 2,
    opacity: 0.8,
    textAlign: "center",
  },
});
