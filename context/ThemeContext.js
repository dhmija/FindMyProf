import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightColors = {
  background:      '#fafaf8',
  surface:         '#fafaf8',
  surfaceElevated: '#f2f2f0',
  text:            '#1a1a1a',
  textMuted:       '#888888',
  textSubtle:      '#555555',
  textVeryMuted:   '#aaaaaa',
  border:          '#e5e5e5',
  borderLight:     '#f0f0f0',
  fill:            '#f0f0f0',
  primary:         '#1a1a1a',
  primaryText:     '#fafaf8',
  tabBar:          '#fafaf8',
  inputBg:         '#fafaf8',
  cardBorder:      '#ebebeb',
  placeholder:     '#bbbbbb',
  overlay:         'rgba(0,0,0,0.55)',
  shadow:          '#1a1a1a',
};

export const darkColors = {
  background:      '#111111',
  surface:         '#1c1c1c',
  surfaceElevated: '#252525',
  text:            '#f0eeea',
  textMuted:       '#888888',
  textSubtle:      '#aaaaaa',
  textVeryMuted:   '#555555',
  border:          '#2a2a2a',
  borderLight:     '#222222',
  fill:            '#2c2c2c',
  primary:         '#f0eeea',
  primaryText:     '#111111',
  tabBar:          '#161616',
  inputBg:         '#1c1c1c',
  cardBorder:      '#252525',
  placeholder:     '#666666',
  overlay:         'rgba(0,0,0,0.75)',
  shadow:          '#000000',
};

const ThemeContext = createContext({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@theme_mode').then(value => {
      if (value === 'dark') setIsDark(true);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('@theme_mode', next ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? darkColors : lightColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
