import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { message } from 'antd';

// Create a context for countries data
const CountriesContext = createContext();

// Custom hook to use countries data
export const useCountries = () => {
  const context = useContext(CountriesContext);
  if (!context) {
    throw new Error('useCountries must be used within a CountriesProvider');
  }
  return context;
};

// Provider component
export const CountriesProvider = ({ children }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,flags');
        const sortedCountries = response.data.sort((a, b) =>
          a.name.common.localeCompare(b.name.common)
        );
        setCountries(sortedCountries);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch countries:', error);
        setError('Failed to fetch countries');
        message.error('Failed to fetch countries');
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Helper function to render country option label
  const renderCountryLabel = (country) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img
        src={country.flags.png}
        alt={country.flags.alt || country.name.common}
        style={{ width: '20px', marginRight: '8px', objectFit: 'contain' }}
      />
      {country.name.common}
    </div>
  );

  return (
    <CountriesContext.Provider value={{ countries, loading, error, renderCountryLabel }}>
      {children}
    </CountriesContext.Provider>
  );
};

export default CountriesProvider;
