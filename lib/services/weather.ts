export interface WeatherForecast {
    date: string;
    code: number; // WMO Weather code
    tempMax: number;
    tempMin: number;
    precipitationProbability: number;
    description: string;
    impactFactor: number; // 0.1 to 2.0 (1.0 is neutral)
}

// KL Coordinates (Default)
const DEFAULT_LAT = 3.140853;
const DEFAULT_LON = 101.693207;

export async function getNextDayForecast(): Promise<WeatherForecast | null> {
    try {
        // Fetch forecast for 2 days (Today & Tomorrow) to get tomorrow's index correctly
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LAT}&longitude=${DEFAULT_LON}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKuala_Lumpur&forecast_days=2`
        );

        const data = await response.json();

        if (!data || !data.daily) {
            console.error('Weather data format invalid');
            return null;
        }

        // Index 1 is Tomorrow
        const i = 1;
        const code = data.daily.weather_code[i];
        const precip = data.daily.precipitation_probability_max[i];

        const description = getWeatherDescription(code);
        const impactFactor = calculateImpactFactor(code, precip);

        return {
            date: data.daily.time[i],
            code: code,
            tempMax: data.daily.temperature_2m_max[i],
            tempMin: data.daily.temperature_2m_min[i],
            precipitationProbability: precip,
            description,
            impactFactor
        };

    } catch (error) {
        console.error('Failed to fetch weather:', error);
        return null;
    }
}

function getWeatherDescription(code: number): string {
    // WMO Weather interpretation codes (WW)
    if (code === 0) return 'Cerah / Sunny ☀️';
    if (code >= 1 && code <= 3) return 'Mendung / Cloudy ☁️';
    if (code >= 45 && code <= 48) return 'Kabilt / Foggy 🌫️';
    if (code >= 51 && code <= 55) return 'Gerimis / Drizzle 🌦️';
    if (code >= 61 && code <= 65) return 'Hujan / Rain 🌧️';
    if (code >= 80 && code <= 82) return 'Hujan Lebat / Showers ⛈️';
    if (code >= 95) return 'Ribut Petir / Thunderstorm 🌩️';
    return 'Tidak Pasti / Unknown';
}

function calculateImpactFactor(code: number, precipProb: number): number {
    // Base logic: High rain = Low Sales (Reduced Stock) via Impact Factor

    // Clear sky / Cloudy (Good for business)
    if (code <= 3) return 1.1; // Upsize 10%

    // Drizzle
    if (code >= 51 && code <= 55) return 1.0; // Neutral

    // Heavy Rain / Thunderstorm OR High Rain Probability (>70%)
    if (code >= 80 || code >= 95 || precipProb > 70) {
        return 0.75; // Reduce 25%
    }

    // Moderate Rain
    if (code >= 61 && code <= 65) {
        return 0.85; // Reduce 15%
    }

    return 1.0;
}
