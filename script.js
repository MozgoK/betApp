var express = require("express"),
  Bet = require('./Main');

var app = express();
let betObj = new Bet();

betObj.logIN('bloody__barb', '890-890890');


app.get("/", function (request, response) {
  response.send(betObj.addresses.home.page);
});

app.get("/roulette", function (request, response) {
  response.send(betObj.addresses.roulette.page);
});

app.get("/config", function (request, response) {
  response.send("<p>config: " + JSON.stringify(betObj.config) + '</p><p>' + JSON.stringify(betObj.users) + '</p><p>' + JSON.stringify(betObj.log) + '</p>');
});

app.get("/products/:productId", function (request, response) {
  response.send("productId: " + request.params["productId"])
});

app.listen(4200);