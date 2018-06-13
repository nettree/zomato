import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  
  constructor(props) {
    super(props);

    this.state = {
      categories: [],
      cityId: 0,
      cuisines: []
    };
  }

  componentDidMount() {
    let userKey = "77858a85ed9093ac6735fb9f5e626f63";
    this.getCategories(userKey);
    this.getAdelaideCusisines(userKey);
  }

  getCategories = (userKey) => {
    fetch("https://developers.zomato.com/api/v2.1/categories", 
      {
        method: 'get',
        headers: new Headers({
          'user-key': userKey
        })
      })
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isCategoriesLoaded: true,
            categories: result.categories
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isCategoriesLoaded: false,
            error
          });
        }
      )
  }

  getAdelaideCusisines = (userKey) => {
    //We only retrieve restaurants in Adelaide
    fetch("https://developers.zomato.com/api/v2.1/cities?q=Adelaide",
      {
        method: 'get',
        headers: new Headers({
          'user-key': userKey
        })
      })
      .then(res => res.json())
      .then(
        (result) => {
          if (result.location_suggestions && Array.isArray(result.location_suggestions)) {
            let location = result.location_suggestions.find(location => location.country_name === 'Australia' && location.state_code === 'SA');
            if (location) {
              this.setState({
                isCityIdLoaded: true,
                cityId: location.id
              })
              this.getCusisines(userKey, location.id);
            }
          }
        },
        (error) => {
          this.setState({
            isCityIdLoaded: false,
            error
          });
        }
      )
  }

  getCusisines = (userKey, cityId) => {
    if (cityId) {
      fetch("https://developers.zomato.com/api/v2.1/cuisines?city_id=" + cityId, 
        {
          method: 'get',
          headers: new Headers({
            'user-key': userKey
          })
        })
        .then(res => res.json())
        .then(
          (result) => {
            this.setState({
              isCuisinesLoaded: true,
              cuisines: result.cuisines
            });
          },
          (error) => {
            this.setState({
              isCuisinesLoaded: false,
              error
            });
          }
        )
    }
  }

  render() {
    console.log(this.state);
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
