import React, { Component } from 'react';
import InputRange from 'react-input-range';
import { Checkbox, CheckboxGroup} from 'react-checkbox-group';

import 'react-input-range/lib/css/index.css';
import './App.css';

const categories = [
  'Dinner',
  'Takeaway',
  'Delivery',
  'Pubs & Bars'
]

const cuisines = [
  'Cafe Food',
  'Asian',
  'Chinese',
  'Coffee and Tea',
  'Bakery',
  'Pub Food',
  'Pizza',
  'Italian',
  'Other',
  'Fast Food',
  'Sandwich'
]

const userKey = "77858a85ed9093ac6735fb9f5e626f63";

const displayedCusineIds = new Set();

class App extends Component {
  
  constructor(props) {
    super(props);

    this.state = {
      categories: [],
      selectedCategories: [],
      cuisines: [],
      selectedCuisines: [],
      restaurants: [],
      restaurantDetails: {},
      rating: {min: 3, max: 5},
      cost: {min: 100, max: 300},
      cityId: 0,
    };
  }

  componentDidMount() {
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

  handleCategoryChange = (selectedCategories) => {
    this.setState({selectedCategories: selectedCategories}, this.searchRestaurants);
  }

  handleCuisineChange = (selectedCuisines) => {
    this.setState({selectedCuisines: selectedCuisines}, this.searchRestaurants);
  }

  searchRestaurants = () => {
    let searchUrl = "https://developers.zomato.com/api/v2.1/search?";
    let selectedCategories = this.state.selectedCategories;
    let selectedCuisines = this.state.selectedCuisines;
    let queryParameters = [];
    
    if(selectedCategories.length > 0) {
      queryParameters.push("category=".concat(selectedCategories.join(",")))
    }

    if(selectedCuisines.length > 0) {
      let otherCuisineIndex = selectedCuisines.indexOf("Other"); 
      let cuisineIds = new Array(selectedCuisines);
      
      // if 'Other' cuisine is selected
      if(otherCuisineIndex !== -1) {
        // remove 'Other' cuisine from selected cuisine ids
        cuisineIds.splice(otherCuisineIndex, 1);
        // add cuisine ids that are not displayed
        this.state.cuisines.forEach(cuisine => {
          if(!displayedCusineIds.has(cuisine.cuisine.cuisine_id)) {
            cuisineIds.push(cuisine.cuisine.cuisine_id);
          }
        });
      }

      queryParameters.push("cuisines=".concat(cuisineIds.join(",")));
    }
    // by default we order search results from high to low rating
    // city is Adelaide
    queryParameters.push("entity_id=" + this.state.cityId);
    queryParameters.push("eneity_type=city");
    queryParameters.push("sort=rating");
    queryParameters.push("order=desc");

    console.log(searchUrl.concat(queryParameters.join("&")));

    fetch(searchUrl.concat(queryParameters.join("&")), 
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
              isResturantsLoaded: true,
              restaurants: result.restaurants
            });
          },
          (error) => {
            this.setState({
              isResturantsLoaded: false,
              error
            });
          }
        )
  }

  getRestaurantDetails = (restaurantId) => () => {
    console.log(restaurantId);
    fetch("https://developers.zomato.com/api/v2.1/restaurant?res_id=" + restaurantId, 
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
              isResturantDetailsLoaded: true,
              restaurantDetails: result
            });
          },
          (error) => {
            this.setState({
              isResturantDetailsLoaded: false,
              error
            });
          }
        )
  }

  renderCategoriesCheckBoxes = () => {
    let checkBoxes = [];
    let allCategories = this.state.categories;
    for(let i = 0; i < categories.length; i++) {
      let category = allCategories.find(item => item.categories.name === categories[i]);
      if(category) {
        let categoryId = category.categories.id;
        let checkboxId = "category-checkbox-" + categoryId;
        checkBoxes.push(
          <div className="form-check" key={checkboxId + "-div"}>
            <label key={checkboxId + "-label"} className="form-check-label" htmlFor={checkboxId}>
              <Checkbox key={checkboxId} className="form-check-input" value={categoryId}/>{category.categories.name}
            </label>
          </div>
        )
      }
    }
    
    return (
      <CheckboxGroup name="categories" checkboxDepth={3} value={this.state.selectedCategories} onChange={this.handleCategoryChange}>
        {checkBoxes}
      </CheckboxGroup>
    )
  }

  renderCusisinesCheckBoxes = () => {
    let checkBoxes = [];
    let allCuisines = this.state.cuisines;
    for(let i = 0; i < cuisines.length; i++) {
      let cuisine = allCuisines.find(item => item.cuisine.cuisine_name === cuisines[i]);
      if(cuisine) {
        let cuisineId = cuisine.cuisine.cuisine_id;
        displayedCusineIds.add(cuisineId);
        let checkboxId = "cuisine-checkbox-" + cuisineId;
        checkBoxes.push(
          <div className="form-check-inline cuisine-check-box-div" key={checkboxId + "-div"}>
            <label key={checkboxId + "-label"} className="form-check-label" htmlFor={checkboxId}>
              <Checkbox key={checkboxId} className="form-check-input" value={cuisineId}/>{cuisine.cuisine.cuisine_name}
            </label>
          </div>
        )
      } else if(cuisines[i] === 'Other') {
        // generate 'Other' cuisine check box
        checkBoxes.push(
          <div className="form-check-inline cuisine-check-box-div" key="other-cuisine-checkbox-div">
            <label key="other-cuisine-checkbox-label" className="form-check-label" htmlFor="other-cuisine-checkbox">
              <Checkbox key= "other-cuisine-checkbox" className="form-check-input" value="Other"/>Other
            </label>
          </div>
        )
      }
    }
    
    return (
      <CheckboxGroup name="cuisines" checkboxDepth={3} value={this.state.selectedCuisines} onChange={this.handleCuisineChange}>
        {checkBoxes}
      </CheckboxGroup>
    )
  }

  renderRangeSliders = () => {
    let sliders = [];

    sliders.push(
      <div className="row">
        <div className="attributes-title">RATING</div>
        <InputRange
          maxValue={5}
          minValue={0}
          value={this.state.rating}
          onChange={value => this.setState({ rating: value })} 
        />
      </div>
    );

    sliders.push(
      <div className="row slider-margin">
        <div className="attributes-title">COST</div>
        <InputRange
        maxValue={500}
        minValue={0}
        formatLabel={value => value === 0 ? `$0` : value === 1000 ? `$1000` : `$` + value}
        value={this.state.cost}
        onChange={value => this.setState({ cost: value })} 
        />
      </div>
    )
    return sliders;
  }

  renderRestaurants = () => {
    var items = [];
    let restaurants = this.state.restaurants;
    let rating = this.state.rating;
    let minRating = rating.min;
    let maxRating = rating.max;
    let cost = this.state.cost;
    let minCost = cost.min;
    let maxCost = cost.max;

    // filter out restaurants which rating and cost are within rangers
    let filteredRestaurants = restaurants.filter(item => {
        let aggregate_rating = Number(item.restaurant.user_rating.aggregate_rating);
        let average_cost = item.restaurant.average_cost_for_two;
        return minRating <= aggregate_rating && aggregate_rating <= maxRating 
                && minCost <= average_cost && average_cost <= maxCost;
      }
    );

    let restaurantDetails = this.state.restaurantDetails;

    for(let i = 0; i < filteredRestaurants.length; i++) {
      let item = filteredRestaurants[i];
      let className = "restaurants-list-group-item restaurants-list-group-item-action";

      if(restaurantDetails && restaurantDetails.id === item.restaurant.id) {
        className += " active";
      }

      items.push(
        <a href="javascript:void(0)" className={className} onClick={this.getRestaurantDetails(item.restaurant.id)}>{item.restaurant.name}</a>
      );
    }

    return (
      <div className="list-group">
        <div className="restaurants-list-group-item restaurants-div-title">RESULTS</div>
        {items}
      </div>
    )
  }

  renderRestaurantDetails = () => {
    let restaurant = this.state.restaurantDetails;
    console.log(restaurant);
    let checkIcon = <i className="fa fa-check check-icon"></i>;
    let crossIcon = <i className="fa fa-close cross-icon"></i>;
    return (
      <div className="row restaurant-detail-div">
        <div className="col-md-1"></div>
        <div className="col-md-5">
          <img src={restaurant.featured_image} className="restaurant-feature-image"/>
        </div>
        <div className="col-md-6">
          <div className="row">
            <div className="col-md-12 restaurant-name-div">{restaurant.name}</div>
          </div>
          <div className="row">
            <div className="col-md-12 restaurant-address-div">{restaurant.location.address}</div>
          </div>
          <div className="row">
            <div>{restaurant.has_table_booking ? checkIcon : crossIcon}</div>
            <div>{restaurant.has_online_delivery ? checkIcon : crossIcon}</div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="container-fluid app-container">
        <div className="row attributes-div-margin">
          <div className="col-md-1"></div>
          <div className="col-md-2">
            <div className="attributes-title checkbox-title-margin">CATEGORY</div>
            {this.state.isCategoriesLoaded && this.renderCategoriesCheckBoxes()}
          </div>
          <div className="col-md-5">
            <div className="attributes-title checkbox-title-margin">CUISINE</div>
            {this.state.isCuisinesLoaded && this.renderCusisinesCheckBoxes()}
          </div>
          <div className="col-md-3">
            {this.renderRangeSliders()}
          </div>
          <div className="col-md-1">
          </div>
        </div>
        <div className="row search-results-div">
          <div className="col-md-4 restaurants-list-div">
            {this.state.isResturantsLoaded && this.renderRestaurants()}
          </div>
          <div className="col-md-8">
            {this.state.isResturantDetailsLoaded && this.renderRestaurantDetails()}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
