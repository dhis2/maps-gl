import React, { Component } from 'react';
import './App.css';
import MapWrapper from './components/MapWrapper';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <MapWrapper className="map"></MapWrapper>
        </header>
      </div>
    );
  }
}

export default App;
