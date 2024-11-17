// Importa solo los módulos necesarios de Firebase
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAFJUcrBDDLPM2SscMvi1x_jUv6Wlqnukg",
  authDomain: "psywell-ab0ee.firebaseapp.com",
  projectId: "psywell-ab0ee",
  storageBucket: "psywell-ab0ee.appspot.com",
  messagingSenderId: "471287872717",
  appId: "1:471287872717:web:588c0acfcb84728c7657d84",
  measurementId: "G-TG8E6CBF8D",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Analytics (opcional)
const analytics = getAnalytics(app);

export { app, analytics };
