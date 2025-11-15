import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'devextreme/dist/css/dx.light.css';

// CSS global đơn giản
const globalStyles = `
  * {
    box-sizing: border-box;
  }
  
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    max-width: 100vw;
    min-height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
  }
  
  @media (min-width: 960px) {
    html, body {
      min-width: 1200px;
      overflow-x: hidden;
      overflow-y: auto;
    }
  }
  
  #root {
    width: 100%;
    max-width: 100vw;
    min-height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
    position: relative;
  }
  
  @media (min-width: 960px) {
    #root {
      min-width: 1200px;
      overflow-x: hidden;
      overflow-y: auto;
    }
  }
  
  /* Prevent horizontal scroll on mobile - but allow vertical */
  @media (max-width: 959px) {
    html, body {
      overflow-x: hidden !important;
      overflow-y: auto !important;
      width: 100% !important;
      max-width: 100vw !important;
      position: relative !important;
    }
    
    body {
      position: relative !important;
      width: 100%;
      min-height: 100vh;
      overflow-x: hidden !important;
      overflow-y: auto !important;
    }
    
    #root {
      width: 100% !important;
      max-width: 100vw !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      position: relative !important;
    }
    
    * {
      max-width: 100vw;
    }
  }
  
`;

// Thêm CSS vào head
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);


const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
// @ts-ignore
root.render(<App />);
