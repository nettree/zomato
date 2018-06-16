import React, { Component } from 'react';
import InputRange from 'react-input-range';
import { Checkbox, CheckboxGroup} from 'react-checkbox-group';

import "bootstrap/scss/_functions.scss";
import "bootstrap/scss/_variables.scss";
import "bootstrap/scss/_mixins.scss";
//import "../node_modules/Font-Awesome/scss/variables";
import "awesome-bootstrap-checkbox";
import 'react-input-range/lib/css/index.css';
import './App.css';

// categories that we want to display as attributes check boxes
const categories = [
  'Dinner',
  'Takeaway',
  'Delivery',
  'Pubs & Bars'
];

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
];

// Zomato API key
const userKey = "77858a85ed9093ac6735fb9f5e626f63";

// default search count
const searchCount = 20;

// we can only get up to 100 restaurants by changing `start` and `count`
const maxResults = 100;

// displayed cuisine ids set
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
      priceRange: {min: 1, max: 3},
      cityId: 0,
      resultsFound: 0,
      start: 0,
      restaurantListDivRef: {}
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
            let location = undefined;

            for(let i = 0; i < result.location_suggestions.length; i++) {
              let item = result.location_suggestions[i];
              if(item.country_name === 'Australia' && item.state_code === 'SA') {
                location = item;
                break;
              }
            }
            
            if (location) {
              this.setState({
                isCityIdLoaded: true,
                cityId: location.id
              });
              this.getCuisines(userKey, location.id);
              this.searchRestaurants(location.id)();
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
    this.setState({
      selectedCategories: selectedCategories,
      start: 0
    }, this.searchRestaurants(this.state.cityId));
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
    this.setState({
      selectedCuisines: selectedCuisines,
      start: 0
    }, this.searchRestaurants(this.state.cityId));
  }

  /**
   * Send search request to Zomato to get restaurants list in Adelaide 
   * based on categories and cuisines attributes selected, we use rating
   * to sort the result order by desc
   */
  searchRestaurants = (cityId) => () => {
    this.setState({
      isLoadingItems: true
    })
    let searchUrl = "https://developers.zomato.com/api/v2.1/search?";
    let selectedCategories = this.state.selectedCategories;
    let selectedCuisines = this.state.selectedCuisines;
    let start = this.state.start;
    let queryParameters = [];

    // search range is within Adelaide
    queryParameters.push("entity_id=" + cityId);
    queryParameters.push("entity_type=city");
    queryParameters.push("start=" + start);
    queryParameters.push("count=" + searchCount);
    
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
            // if start is greater than 0, it means more 
            // items are loaded with same filters, we then
            // should contact new restaurants
            let newRestaurants = result.restaurants;
            if(result.results_start > 0) {
              newRestaurants = this.state.restaurants.concat(result.restaurants);
            }
            this.setState({
              isResturantsLoaded: true,
              restaurants: newRestaurants,
              resultsFound: result.results_found,
              start: start + searchCount,
              isLoadingItems: false
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
    // prevent default click event as use '#' as href, we don't want jump when clicking
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
   * Event handler when scroll down restaurant list
   */
  onRestaurantListScroll = () => {
    let listDiv = this.state.restaurantListDivRef;
    // next search start index
    let start = this.state.start;
    if(listDiv && start < maxResults) {
      let resultsFound = this.state.resultsFound;
      let scrollPercentage = listDiv.scrollTop / (listDiv.scrollHeight - listDiv.clientHeight);
      // if total results are more than current items number
      // we say there are more results
      let hasMoreResults = resultsFound > start;
      let isLoadingItems = this.state.isLoadingItems;
      if(!isLoadingItems && scrollPercentage > 0.75 && hasMoreResults) {
        this.searchRestaurants(this.state.cityId)();
      }
    }
  }

  /**
   * Set restaurants list div ref to state and bind scroll event to it
   */
  setRestaurantsListDivRef = (listDiv) => {
    listDiv.addEventListener('scroll', this.onRestaurantListScroll);
    this.setState({
      restaurantListDivRef: listDiv
    })
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
            <div key={checkboxId + "-div"} className="form-check abc-checkbox abc-checkbox-info">
              <Checkbox key={checkboxId} id={checkboxId} className="form-check-input" value={categoryId}/>
              <label key={checkboxId + "-label"} className="form-check-label" htmlFor={checkboxId}>
                {category.categories.name}
              </label>
            </div>
          )
        }
      }
      
      return (
        <CheckboxGroup key="categories-checkbox-group" name="categories" checkboxDepth={2} value={this.state.selectedCategories} onChange={this.handleCategoryChange}>
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
            <div key={checkboxId + "-div"} className="form-check-inline cuisine-checkbox-div abc-checkbox abc-checkbox-info" >
              <Checkbox key={checkboxId} id={checkboxId} className="form-check-input" value={cuisineId}/>
              <label key={checkboxId + "-label"} className="form-check-label" htmlFor={checkboxId}>
                {cuisine.cuisine.cuisine_name}
              </label>
            </div>
          )
        } else if(cuisines[i] === 'Other') {
          // generate 'Other' cuisine check box
          checkBoxes.push(
            <div key="other-cuisine-checkbox-div" className="form-check-inline cuisine-checkbox-div abc-checkbox abc-checkbox-info">
              <Checkbox key= "other-cuisine-checkbox" className="form-check-input" value="Other"/>
              <label key="other-cuisine-checkbox-label" className="form-check-label" htmlFor="other-cuisine-checkbox">
                Other
              </label>
            </div>
          )
        }
      }
      
      return (
        <CheckboxGroup key="cuisines-checkbox-group" name="cuisines" checkboxDepth={2} value={this.state.selectedCuisines} onChange={this.handleCuisineChange}>
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
    let highestRating = 5;
    let lowestRating = 0;
    let ratingSlidingStep = 0.1;

    sliders.push(
      <div key="rating-slider-div" className="row">
        <div key="rating-slider-attributes-div" className="attributes-title">RATING</div>
        <InputRange
          key="rating-input-range"
          allowSameValues={true}
          maxValue={highestRating}
          minValue={lowestRating}
          step={ratingSlidingStep}
          value={this.state.rating}
          onChange={value => this.setState({ rating: value })} 
        />
      </div>
    );

    // add price range slider
    let pocketFriendly = 1;
    let costliest = 4;
    sliders.push(
      <div key="cost-slider-div" className="row slider-margin">
        <div key="cost-slider-attributes-div" className="attributes-title">COST</div>
        <InputRange
          key="cost-input-range"
          allowSameValues={true}
          maxValue={costliest}
          minValue={pocketFriendly}
          formatLabel={value => value === pocketFriendly ? `$` : value === costliest ? `$$$$` : ``}
          value={this.state.priceRange}
          onChange={value => this.setState({ priceRange: value })} 
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
    let priceRange = this.state.priceRange;
    let minCost = priceRange.min;
    let maxCost = priceRange.max;

    // filter out restaurants which rating and cost are within rangers
    let filteredRestaurants = restaurants.filter(item => {
        let aggregateRating = Number(item.restaurant.user_rating.aggregate_rating);
        let priceRange = item.restaurant.price_range;
        return minRating <= aggregateRating && aggregateRating <= maxRating 
                && minCost <= priceRange && priceRange <= maxCost;
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
    let isBookingAvailable = restaurant.has_table_booking;
    let isDeliveryAvailable = restaurant.has_online_delivery;

    return (
      <div className="row restaurant-detail-div">
        <div className="col-md-1"></div>
        <div className="col-md-5">
          <img src={restaurant.featured_image || restaurant.thumb || "./images/no_image_available.png"} alt="" className="restaurant-feature-image"/>
        </div>
        <div className="col-md-6 details-div">
          <div className="row">
            <div className="col-md-12 restaurant-name-div">{restaurant.name}</div>
          </div>
          <div className="row">
            <div className="col-md-12 restaurant-address-div">{restaurant.location.address}</div>
          </div>
          <div className="row restaurant-booking-div-margin">
            <div className="col-md-12 restaurant-booking-div">{isBookingAvailable ? checkIcon : crossIcon} {isBookingAvailable ? "Bookings available" : "No bookings"}</div>
          </div>
          <div className="row">
            <div className="col-md-12 restaurant-delivery-div">{isDeliveryAvailable ? checkIcon : crossIcon} {isDeliveryAvailable ? "Delivery available" : "No delivery"}</div>
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
            <div className="attributes-title checkbox-title-margin category-checkbox-title-div">CATEGORY</div>
            {this.state.isCategoriesLoaded && this.renderCategoriesCheckBoxes()}
          </div>
          <div className="col-md-6 cuisine-div">
            <div className="attributes-title checkbox-title-margin cuisine-checkbox-title-div">CUISINE</div>
            {this.state.isCuisinesLoaded && this.renderCuisinesCheckBoxes()}
          </div>
          <div className="col-md-3 col-sm-9 slider-div">
            {this.renderRangeSliders()}
          </div>
        </div>
        <div className="row search-results-div">
          <div className="col-md-4 restaurants-list-div" ref={this.setRestaurantsListDivRef}>
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
