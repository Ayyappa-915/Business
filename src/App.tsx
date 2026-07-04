import React from 'react';
import { Provider } from 'react-redux';
import store from './app/store';
import AppRoutes from './routes/AppRoutes';
import { NotificationProvider } from './context/NotificationContext';
import './styles/globals.css';

function App() {
  return (
    <Provider store={store}>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </Provider>
  );
}

export default App;
