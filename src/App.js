import React, { Component } from 'react';
import InputRange from 'react-input-range';
import { Checkbox, CheckboxGroup} from 'react-checkbox-group';

import 'react-input-range/lib/css/index.css';
import './App.css';

// categories that we want to display as attributes check boxes
const categories = [
  'Dinner',
  'Takeaway',
  'Delivery',
  'Pubs & Bars'
]

// cuisines that we want to display as attributes check boxes
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

// Zomato API key
const userKey = "77858a85ed9093ac6735fb9f5e626f63";

const displayedCuisineIds = new Set();

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
      cost: {min: 50, max: 300},
      cityId: 0,
    };
  }

  // Send ajax requests when component is mounted to page
  componentDidMount() {
    this.getCategories(userKey);
    this.getAdelaideCuisines(userKey);
  }

  /**
   * Get all categories from Zomato
   * 
   * @param userKey Zomato API key
   */
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
        (error) => {
          this.setState({
            isCategoriesLoaded: false,
            error
          });
        }
      )
  }

  /**
   * Get Adelaide cuisines from Zomato
   * 
   * @param userKey Zomato API key
   */
  getAdelaideCuisines = (userKey) => {
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
              });
              this.getCuisines(userKey, location.id);
              //this.searchRestaurants();
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

  /**
   * Get available cuisines using city id, in our case, it's Adelaide
   * 
   * @param userKey Zomato API key
   * @param cityId city ID of Adelaide
   */
  getCuisines = (userKey, cityId) => {
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

  /**
   * Click event handler for category check box group, a callback method of searching restaurants 
   * will be executed after selected categories is set to state, this will ensure search restaurants
   * method get the latest change
   * 
   * @param selectedCategories the value of this will always be an array of selected category Ids 
   *
   */
  handleCategoryChange = (selectedCategories) => {
    this.setState({selectedCategories: selectedCategories}, this.searchRestaurants);
  }

  /**
   * Click event handler for cuisine check box group, a callback method of searching restaurants 
   * will be executed after selected cuisines is set to state, this will ensure search restaurants
   * method get the latest change
   * 
   * @param selectedCuisines the value of this will always be an array of selected cuisines Ids 
   *
   */
  handleCuisineChange = (selectedCuisines) => {
    this.setState({selectedCuisines: selectedCuisines}, this.searchRestaurants);
  }

  /**
   * Send search request to Zomato to get restaurants list in Adelaide 
   * based on categories and cuisines attributes selected, we use rating
   * to sort the result order by desc
   */
  searchRestaurants = () => {
    let searchUrl = "https://developers.zomato.com/api/v2.1/search?";
    let selectedCategories = this.state.selectedCategories;
    let selectedCuisines = this.state.selectedCuisines;
    let queryParameters = [];

    // by default we order search results from high to low rating
    // city is Adelaide
    queryParameters.push("entity_id=" + this.state.cityId);
    queryParameters.push("entity_type=city");
    queryParameters.push("sort=rating");
    queryParameters.push("order=desc");
    
    // append selected categories to query parameters
    if(selectedCategories.length > 0) {
      queryParameters.push("category=".concat(selectedCategories.join(",")))
    }

    // append selected cuisines to query parameters
    if(selectedCuisines.length > 0) {
      let otherCuisineIndex = selectedCuisines.indexOf("Other"); 
      let cuisineIds = new Array(selectedCuisines);
      
      // if 'Other' cuisine is selected
      if(otherCuisineIndex !== -1) {
        // remove 'Other' cuisine from selected cuisine ids
        cuisineIds.splice(otherCuisineIndex, 1);
        // add cuisine ids that are not displayed yet returned from Zomato
        this.state.cuisines.forEach(cuisine => {
          if(!displayedCuisineIds.has(cuisine.cuisine.cuisine_id)) {
            cuisineIds.push(cuisine.cuisine.cuisine_id);
          }
        });
      }

      queryParameters.push("cuisines=".concat(cuisineIds.join(",")));
    }

    // perform search
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
            result.restaurants.forEach(res => console.log(res));
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

  /**
   * Send search request to Zomato to get specific restaurant details
   * 
   * @param restaurantId restaurant id from Zomato
   */
  getRestaurantDetails = (restaurantId) => (e) => {
    e.preventDefault();
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

  /**
   * Render check box group of categories attributes
   */
  renderCategoriesCheckBoxes = () => {
    if (this.state.categories !== undefined) {
      let checkBoxes = [];
      let allCategories = this.state.categories;

      for(let i = 0; i < categories.length; i++) {
        let category = undefined;

        for(let j = 0; j < allCategories.length; j++) {
          let item = allCategories[j];
          if(item.categories.name === categories[i]) {
            category = item;
            break;
          }
        }
        // Test in IE find that it doesn't support .find(), so use above logic to replace
        // let category = allCategories.find(item => item.categories.name === categories[i]);
        if(category) {
          let categoryId = category.categories.id;
          let checkboxId = "category-checkbox-" + categoryId;
          checkBoxes.push(
            <div key={checkboxId + "-div"} className="form-check">
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
  }

  /**
   * Render check box group of cuisines attributes
   */
  renderCuisinesCheckBoxes = () => {
    if (this.state.cuisines !== undefined) {
      let checkBoxes = [];
      let allCuisines = this.state.cuisines;

      for(let i = 0; i < cuisines.length; i++) {
        let cuisine = undefined;

        for(let j = 0; j < allCuisines.length; j++) {
          let item = allCuisines[j];
          if(item.cuisine.cuisine_name === cuisines[i]) {
            cuisine = item;
            break;
          }
        }
        // Test in IE find that it doesn't support .find(), so use above logic to replace
        // let cuisine = allCuisines.find(item => item.cuisine.cuisine_name === cuisines[i]);
        if(cuisine) {
          let cuisineId = cuisine.cuisine.cuisine_id;
          let checkboxId = "cuisine-checkbox-" + cuisineId;
          displayedCuisineIds.add(cuisineId);
          checkBoxes.push(
            <div key={checkboxId + "-div"} className="form-check-inline cuisine-check-box-div" >
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
  }

  /**
   * Render Rating and Cost filter slider
   */
  renderRangeSliders = () => {
    let sliders = [];

    sliders.push(
      <div className="row">
        <div className="attributes-title">RATING</div>
        <InputRange
          maxValue={5}
          minValue={0}
          step={0.1}
          value={this.state.rating}
          onChange={value => this.setState({ rating: value })} 
        />
      </div>
    );

    sliders.push(
      <div className="row slider-margin">
        <div className="attributes-title">COST</div>
        <InputRange
          maxValue={1000}
          minValue={0}
          formatLabel={value => value === 0 ? `$` : value === 1000 ? `$$$$` : ``}
          value={this.state.cost}
          onChange={value => this.setState({ cost: value })} 
        />
      </div>
    )

    return sliders;
  }

  /**
   * Render restaurants list items
   */
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
        <a href="#" className={className} onClick={this.getRestaurantDetails(item.restaurant.id)}>{item.restaurant.name}</a>
      );
    }

    return (
      <div className="list-group list-group-flush">
        <div className="restaurants-list-group-item restaurants-div-title">RESULTS</div>
        {items}
      </div>
    )
  }

  /**
   * Render restaurant details (RHS)
   */
  renderRestaurantDetails = () => {
    let restaurant = this.state.restaurantDetails;
    let checkIcon = <i className="fa fa-check check-icon"></i>;
    let crossIcon = <i className="fa fa-close cross-icon"></i>;
    let isBookingAvailable = restaurant.has_table_booking || restaurant.is_table_reservation_supported;
    let isDeliveryAvailable = restaurant.has_online_delivery || restaurant.is_delivering_now;

    return (
      <div className="row restaurant-detail-div">
        <div className="col-md-1"></div>
        <div className="col-md-5">
          <img src={restaurant.featured_image || restaurant.thumb || "./images/no_image_available.png"} alt="" className="restaurant-feature-image"/>
        </div>
        <div className="col-md-6">
          <div className="row">
            <div className="col-md-12 restaurant-name-div">{restaurant.name}</div>
          </div>
          <div className="row">
            <div className="col-md-12 restaurant-address-div">{restaurant.location.address}</div>
          </div>
          <div className="row restaurant-booking-div-margin">
            <div className="col-md-12 restaurant-booking-div">{ isBookingAvailable ? checkIcon : crossIcon} {isBookingAvailable ? "Bookings available" : "No bookings"}</div>
          </div>
          <div className="row">
            <div className="col-md-12 restaurant-delivery-div">{ isDeliveryAvailable ? checkIcon : crossIcon} {isDeliveryAvailable ? "Delivery available" : "No delivery"}</div>
          </div>
          <div className="row restaurant-cuisin-div-margin">
            <div className="col-md-12 restaurant-cuisine-title">CUISINE</div>
          </div>
          <div className="row">
            <div className="col-md-12 restaurant-cuisine-text">{restaurant.cuisines}</div>
          </div>
          <div className="row restaurant-phone-div-margin">
            <div className="col-md-12 restaurant-phone-title">PHONE NUMBER</div>
          </div>
          <div className="row">
            <div className="col-md-12 restaurant-phone-text">{restaurant.phone_numbers ? restaurant.phone_numbers : "No phone number available"}</div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="container-fluid app-container">
        <div className="row attributes-div-margin">
          <div className="col-md-2">
            <div className="attributes-title checkbox-title-margin">CATEGORY</div>
            {this.state.isCategoriesLoaded && this.renderCategoriesCheckBoxes()}
          </div>
          <div className="col-md-6">
            <div className="attributes-title checkbox-title-margin">CUISINE</div>
            {this.state.isCuisinesLoaded && this.renderCuisinesCheckBoxes()}
          </div>
          <div className="col-md-3">
            {this.renderRangeSliders()}
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
