// App.js é o ponto inicial da aplicação.
// Ele apenas renderiza o componente Routes.
//
// Routes é responsável por toda a navegação do app
// (Splash, Login e as telas com a barra inferior).
// Separar assim deixa o App.js mais limpo e organizado.
import React from 'react';
import Routes from './src/routes';

export default function App() {
  return <Routes />;
}