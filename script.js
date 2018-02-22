const express = require("express");
const bodyParser = require('body-parser');
const request = require('request');
const Bet = require('./Main');

const server = express();
const application = new Bet();


server.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});


server.get("/", function (req, res) {
  if (!application.config.auth) {

    application.logIN('bloody__barb', '890-890890', null, (page) => res.send(page));

  } else application.getPage('home', () => res.send(application.addresses.home.page));
  
});

server.get("/start/:number/:bet/:multiplier", function (req, res) {
  if (!application.config.auth && !application.timer.on) {
    application.startMakeBet({
      login: 'bloody__barb',
      pass: '890-890890',
      bet: req.params['bet'],
      callback: (result) => res.json({makeBet: result}),
      number: req.params['number'],
      multiplier: +req.params['multiplier']
    });
  } else {
    res.send('Уже авторизованы: ' + application.config.auth + ', таймер запущен: ' + application.timer.on);
  }
});

// server.get("/start/:one/:two/:three", function (req, res) {
//   res.redirect('/' + req.params['three']);
// });

server.get("/stop", function (req, res) {
  application.stopTimer(true);
  res.send('Таймер остановлен');
});


server.get("/home(.php)?", function (req, res) {
  application.getPage('home', () => res.send(application.addresses.home.page));
});
server.get("/roulette(.php)?", function (req, res) {
  application.getPage('roulette', () => res.send(application.addresses.roulette.page));
});
server.get("/inforoul(.php)?", function (req, res) {
  application.getPage('inforoul', () => res.send(application.addresses.inforoul.page));
});



server.get("/auth", function (req, res) {
  application.getPage('home', () => res.json({auth: application.config.auth}));
});

// server.get("/check", function (req, res) {
//   application.fullCheckWin();
// });


server.get("/config", function (req, res) {
  res.json(application.config);
});

server.get("/timer", function (req, res) {
  res.json({
    on: application.timer.on,
    needS: application.timer.needS,
    seconds: application.timer.seconds,
    minutes: application.timer.minutes
  });
});

server.get("/log", function (req, res) {
  res.json(application.log);
});



server.get("/products/:productId", function (req, res) {
  response.send("productId: " + req.params["productId"])
});

server.listen(4200);


setInterval(() => {
  request.get
}, 600000 + application.getRandomInt(100000, 300000));


const abra = function() {
  setTimeout(() => {
    request('https://bet-application.herokuapp.com/', function (error, response, body) {});
    abra();
  }, 600000 + application.getRandomInt(100000, 300000));
}

abra();