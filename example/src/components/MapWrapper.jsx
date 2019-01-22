import React, { Component } from 'react';
import D2Map from '@dhis2/maps-gl';

class MapWrapper extends Component {
  propTypes = {};
  container = null;
  map = null;

  componentDidMount() {
    this.map = new D2Map(this.container);
  }

  render() {
    return (
      <div ref={ref => this.container = ref} {...this.props} />
    )
  }
}

export default MapWrapper;