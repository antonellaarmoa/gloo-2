import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminHistoryContext = createContext();

export function AdminHistoryProvider({ children }) {
  const [history, setHistory] = useState([]);

  // Cargar historial al iniciar
  useEffect(() => {
    AsyncStorage.getItem('adminHistory').then(data => {
      if (data) {
        console.log('HISTORIAL CARGADO DESDE STORAGE:', JSON.parse(data));
        setHistory(JSON.parse(data));
      } else {
        console.log('NO HAY HISTORIAL EN STORAGE');
      }
    });
  }, []);

  // Guardar historial cada vez que cambia
  useEffect(() => {
    AsyncStorage.setItem('adminHistory', JSON.stringify(history));
    console.log('HISTORIAL GUARDADO EN STORAGE:', history);
  }, [history]);

  const addAction = (action) => {
    console.log('AGREGANDO AL HISTORIAL:', action);
    setHistory(prev => [action, ...prev]);
  };

  const clearHistory = () => {
    setHistory([]);
    AsyncStorage.removeItem('adminHistory');
    console.log('HISTORIAL LIMPIADO');
  };

  return (
    <AdminHistoryContext.Provider value={{ history, addAction, clearHistory, setHistory }}>
      {children}
    </AdminHistoryContext.Provider>
  );
}

export function useAdminHistory() {
  return useContext(AdminHistoryContext);
} 