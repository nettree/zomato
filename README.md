# zomataurant
A Project that uses Zomato APIs to retrieve restaurant information in Adelaide

## Features

* Browse restaurants in Adelaide, initially 20 restaurants will be loaded up
* Change filter `Category` or/and `Cuisine` to search for other restaurants
* Use `Rating` or/and `COST` slider to filter search results, range of rating slider is 0 to 5 with step 0.1, range of cost slider is based on price_range defined by Zomato, which is 1 to 4, so each step is 1.
* Click on item in search results will retrieve restaurant details and display it, phone number can only be accessed by partner API credential, and hours information is missing from Zomato API, so those are not included in detail page
* By scrolling down in search results list, it will load an extra 20 restaurants depend on results found, up to 100 restaurants can be loaded (limitation set by Zomato)
* Mobile phone user friendly

## How to Run It
Clone project to your local, make sure `npm` is stalled on your machine. Recommended version is:

```
node -v
v8.11.3
npm -v
5.6.0
```

Run `npm install` in cloned project folder. For example, if you clone the project to `/opt/zomato`, then in your terminal, input commands below:

```
cd /opt/zomato
npm install
```

After that, run `npm start` to start server, then go to `http://localhost:3000/` to try it.

Enjoy your restaurants navigator of Adelaide!