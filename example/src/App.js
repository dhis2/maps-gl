import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import MapWrapper from './components/MapWrapper';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <MapWrapper style={{
            width: 800,
            height: 600,
          }}></MapWrapper>
        </header>
      </div>
    );
  }
}

export default App;
