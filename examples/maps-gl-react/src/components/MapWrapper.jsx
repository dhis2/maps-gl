import React, { Component } from 'react';
import D2Map from '@dhis2/maps-gl';

class MapWrapper extends Component {
  static propTypes = {};
  container = null;
  map = null;

  // Map created in constructor to be accessible in child components
  constructor(props, context) {
    super(props, context);

    const mapDiv = document.createElement('div');
    mapDiv.style.width = '100%';
    mapDiv.style.height = '100%';

    this.map = new D2Map(mapDiv);  
  }

  componentDidMount() {
    this.container.appendChild(this.map.getContainer());
    this.map.resize();
  }

  render() {
    return (
      <div 
        ref={ref => this.container = ref} 
        {...this.props} 
      />
    )
  }
}

export default MapWrapper;