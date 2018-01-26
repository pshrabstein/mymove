import React, { Component } from 'react';
import { Provider } from 'react-redux';

import AppWrapper from 'shared/App/AppWrapper';
import store from 'shared/store';
import './App.css';

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <AppWrapper />
      </Provider>
    );
  }
}

export default App;
