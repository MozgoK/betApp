var express = require("express"),
  Bet = require('./Main');

var app = express();
let betObj = new Bet();

// betObj.logIN('bloody__barb', '890-890890');


app.get("/", function (request, response) {
  // if (!betObj.config.auth) {
  //   betObj.startMakeBet({
  //     login: 'bloody__barb',
  //     pass: '890-890890'
  //   });
  // }
  betObj.getPage('home', () => response.send(betObj.addresses.home.page));
  
});

app.get("/start", function (request, response) {
  betObj.startMakeBet({
    login: 'bloody__barb',
    pass: '890-890890'
  });
  response.send('startMakeBet');
});

app.get("/home(.php)?", function (request, response) {
  betObj.getPage('home', () => response.send(betObj.addresses.home.page));
});

app.get("/roulette(.php)?", function (request, response) {
  betObj.getPage('roulette', () => response.send(betObj.addresses.roulette.page));
});

app.get("/check", function (request, response) {
  betObj.fullCheckWin();
});

app.get("/config", function (request, response) {
  response.send("<p>config: " + JSON.stringify(betObj.config) + '</p><p>' + JSON.stringify(betObj.users) + '</p><p>' + JSON.stringify(betObj.log) + '</p>');
});

app.get("/products/:productId", function (request, response) {
  response.send("productId: " + request.params["productId"])
});

app.listen(4200);