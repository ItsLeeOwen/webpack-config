import React from "react"

import {
  Link,
  Route,
} from 'react-router-dom'

import Fluffykins from "./fluffykins"
import Abbykins from "./abbykins"

export default class App extends React.Component {
  static Var = "Hello"
  
  render() {
    return (
      <div>
        <h1>
          <Link to="/">React App Starter</Link>
        </h1>
        <nav>
          <Link to="/abbykins">Abbykins</Link>
          <br />
          <Link to="/fluffykins">Fluffykins</Link>
        </nav>

        <Route
          path="/abbykins"
          component={Abbykins} />
        <Route
          path="/fluffykins"
          component={Fluffykins} />
      </div>
    )
  }
}