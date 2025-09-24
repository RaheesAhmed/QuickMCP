/**
 * Weather Service Example - HTTP API Server
 * Demonstrates: HTTP server, tools, error handling, mock APIs
 */

import { createServer, Responses, Schema } from '../../dist/src/index.js';

// Create HTTP server for API access
const server = createServer({
  name: 'weather-mcp-server',
  transport: 'http',
  http: {
    port: 3001,
    enableCors: true
  },
  debug: true
});

// Weather tools
server.tool('getCurrentWeather', async (args: Record<string, any>) => {
  const { city, units = 'metric' } = args as { city: string; units?: string };
  
  try {
    // Simulate API call (replace with real API in production)
    const mockData = {
      temperature: units === 'metric' ? 22 : 72,
      description: 'Partly cloudy',
      humidity: 65,
      windSpeed: units === 'metric' ? 5.2 : 11.6,
      units
    };

    return Responses.success({
      city,
      weather: mockData,
      timestamp: new Date().toISOString()
    }, `Current weather in ${city}`);
  } catch (error) {
    return Responses.error(`Failed to fetch weather for ${city}`, { error: (error as Error).message });
  }
}, {
  description: 'Get current weather for a city',
  schema: Schema.build({ 
    city: 'string',
    units: 'string' // metric, imperial, kelvin
  })
});

server.tool('getForecast', async (args: Record<string, any>) => {
  const { city, days = 5 } = args as { city: string; days?: number };
  
  if (days > 7) {
    return Responses.error('Forecast is only available for up to 7 days');
  }

  // Mock forecast data
  const forecast = Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    temperature: { min: 15 + i, max: 25 + i },
    description: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][i % 4],
    precipitation: Math.random() * 100
  }));

  return Responses.success({
    city,
    forecast,
    days
  }, `${days}-day forecast for ${city}`);
}, {
  description: 'Get weather forecast for multiple days',
  schema: Schema.build({
    city: 'string',
    days: 'number'
  })
});

server.tool('convertTemperature', async (args: Record<string, any>) => {
  const { temperature, from, to } = args as { 
    temperature: number; 
    from: 'celsius' | 'fahrenheit' | 'kelvin'; 
    to: 'celsius' | 'fahrenheit' | 'kelvin' 
  };

  let celsius: number;
  
  // Convert to Celsius first
  switch (from) {
    case 'celsius':
      celsius = temperature;
      break;
    case 'fahrenheit':
      celsius = (temperature - 32) * 5/9;
      break;
    case 'kelvin':
      celsius = temperature - 273.15;
      break;
  }

  // Convert from Celsius to target
  let result: number;
  switch (to) {
    case 'celsius':
      result = celsius;
      break;
    case 'fahrenheit':
      result = (celsius * 9/5) + 32;
      break;
    case 'kelvin':
      result = celsius + 273.15;
      break;
  }

  return Responses.success({
    original: { value: temperature, unit: from },
    converted: { value: Math.round(result * 100) / 100, unit: to },
    formula: `${temperature}°${from.charAt(0).toUpperCase()} = ${result}°${to.charAt(0).toUpperCase()}`
  });
}, {
  description: 'Convert temperature between units',
  schema: Schema.build({
    temperature: 'number',
    from: 'string',
    to: 'string'
  })
});

server.tool('getCoordinates', async (args: Record<string, any>) => {
  const { city } = args as { city: string };
  
  // Mock coordinates (replace with real geocoding API)
  const mockCoords: Record<string, { lat: number; lng: number }> = {
    'london': { lat: 51.5074, lng: -0.1278 },
    'new york': { lat: 40.7128, lng: -74.0060 },
    'tokyo': { lat: 35.6762, lng: 139.6503 },
    'paris': { lat: 48.8566, lng: 2.3522 }
  };

  const coords = mockCoords[city.toLowerCase()] || { lat: 0, lng: 0 };
  
  return Responses.success({
    city,
    coordinates: coords,
    formatted: `${coords.lat}, ${coords.lng}`
  }, `Coordinates for ${city}`);
}, {
  description: 'Get coordinates for a city name',
  schema: { city: 'string' }
});

console.log('🌤️  Starting Weather MCP Server...');
await server.start();

console.log('✅ Weather Server running on http://localhost:3001/mcp');
console.log('📊 Server Stats:', server.getStats());
