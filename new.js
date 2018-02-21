var http = require("http");
var request = require('request'), iconv = require('iconv-lite');;
// var qs = require('querystring');

let headers = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  // 'Accept-Encoding': 'deflate',
  'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36',
  'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
  'Cache-Control': 'max-age=0',
  'Upgrade-Insecure-Requests': '1',
  'Content-Type': 'application/x-www-form-urlencoded',
  // 'Cookie': '_ym_uid=1488381311704240006; __utmz=80519182.1516128886.1.1.utmccn=(direct)|utmcsr=(direct)|utmcmd=(none); __utmc=80519182; _ym_isad=1; __utma=80519182.1768711540.1516128886.1519145989.1519150140.22; __utmb=80519182; duration=16154',
  'Origin': 'http://www.heroeswm.ru',
  'Host': 'www.heroeswm.ru',
};

let result;

request.post({
  url: 'http://heroeswm.ru/login.php',
  form: {
    'LOGIN_redirect': '1',
    'login': 'bloody__barb',
    'pass': '890-890890',
    'pliv': '9999' },
  headers
}, function (err, httpResponse, body) {
  let cookie = [];
  httpResponse.headers['set-cookie'].forEach((el) => {
    if (el.indexOf('deleted') === -1) {
      let temp;
      if (el.indexOf(';') === -1) {
        temp = el;
      } else {
        temp = el.split(';')[0];
      }
      cookie.push(temp);
    }
  });

  headers['Cookie'] = cookie.join(';');
  // headers['Content-Type'] = 'text/html';
  console.log(headers['Cookie']);


  request.get({
    url: 'http://www.heroeswm.ru/home.php',
    // encoding: null,

    headers
  }, function (err, httpResponse, body) {
    console.log(httpResponse.headers);
    console.log(httpResponse.statusCode);
    console.log(httpResponse.headers['content-type']);
    // httpResponse.setEncoding('utf8');
    // console.log(body);
    // console.log(httpResponse.body);
    result = body;

  })
 })


http.createServer(function (request, response) {

  response.end(result);

}).listen(4200, "127.0.0.1", function () {
  console.log("Сервер начал прослушивание запросов на порту 3000");
});