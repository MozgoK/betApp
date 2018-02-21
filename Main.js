var request = require('request'), iconv = require('iconv-lite');
class Bet {
  constructor() {
    this.headers = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36',
      'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
      'Cache-Control': 'max-age=0',
      'Upgrade-Insecure-Requests': '1',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'http://www.heroeswm.ru',
      'Host': 'www.heroeswm.ru',
    };

    this.form = {
      'LOGIN_redirect': '1',
      'login': 'bloody__barb',
      'pass': '890-890890',
      'pliv': '9999'
    };

    // this.loginFlag = false;

    this.addresses = {
      host: 'http://www.heroeswm.ru',
      login: 'http://heroeswm.ru/login.php',
      home: {
        url: 'http://www.heroeswm.ru/home.php',
        page: null
      },
      roulette: {
        url: 'http://www.heroeswm.ru/roulette.php',
        page: null
      },
      inforoul: {
        url: 'http://www.heroeswm.ru/inforoul.php?id=',
        page: null
      },
      parlay: {
        url: 'http://www.heroeswm.ru/parlay.php',
        page: null
      }
    };

    this.cookie = [];

    this.reg = {
      time: /height=17>\s+(.+?):(.+?), (?:.+?) online&/,
      gold: /<img border=0 width=24 height=24 alt="" src="(?:.+?)gold.gif" title="Золото"><\/td><td>(.+?)<\/td>/,
      minutesForBet: /<input type=hidden name=minutes value=(.+?)><\/td>/,
      goldForBet: /<input type=hidden name=cur_pl_bet value='(.+?)'>/,
      checkBet: /<center><b>Ваши ставки<\/b><\/center>\s*<table border=0 cellpadding=2 class=wb align=center>\s*<tr><td class=wblight width=50><b>Ставка<\/b><\/td>\s*<td class=wblight width=150><b>Поле<\/b><\/td><\/tr>\s*<tr><td class=wblight align=right>(.+?)<\/td><td class=wblight>Straight up (.+?)<\/td>/,

    };

    this.config = {
      NUMBER: 33,
      auth: false
    };

    this.users = {};
    this.log = [];

  }


  // Авторизация
  logIN(login, pass) {
    this.users[login] = pass;

    request.post({
      url: this.addresses.login,
      form: {
        'LOGIN_redirect': '1',
        'login': login,
        'pass': pass,
        'pliv': '9999'
      },
      headers: this.headers
    }, (err, httpResponse, body) => {

      if (err) {
        console.error('Error: ' + err);
        return;
      }

      if (httpResponse.headers['set-cookie']) {
        this.searchCookie(httpResponse.headers['set-cookie']);
      }

      // this.headers['Content-Type'] = 'text/html';
      this.getPage('home', (page) => {

        // Сделать ставку на 100
        // this.makeBet(100);

      });
    });
  }


  // Сделать ставку
  makeBet(bet) {
    this.getPage('roulette', () => {

      this.getParamForBet();

      request.post({
        url: this.addresses.parlay.url,
        form: {
          'bet': bet.toString(),
          'minutes': this.config.minutesForBet,
          'bettype': 'Straight up ' + this.config.NUMBER,
          'cur_pl_bet': this.config.goldForBet
        },
        headers: Object.assign({ 'Cookie': this.cookie.join(';') }, this.headers)
      }, (err, httpResponse, body) => {

        if (err) {
          console.error('Error: ' + err);
          return;
        }

        if (httpResponse.headers['set-cookie']) {
          this.searchCookie(httpResponse.headers['set-cookie']);
        }

        this.getPage('roulette', () => this.checkBet(bet));
      });

    });
  }

  getPage(name, callback) {
    request.get({
      url: this.addresses[name].url,
      encoding: null,
      headers: Object.assign({ 'Cookie': this.cookie.join(';') }, this.headers)
    }, (err, httpResponse, body) => {

      if (err) {
        console.error('Error: ' + err);
        return;
      }

      if (httpResponse.headers['set-cookie']) {
        this.searchCookie(httpResponse.headers['set-cookie']);
      }

      this.addresses[name].page = iconv.decode(body, 'win1251');

      // Узнаем время и количество золота
      this.getTime(this.addresses[name].page);
      this.getGold(this.addresses[name].page);

      if (callback) callback(this.addresses[name].page);

    });
  }

  getTime(page) {
    let temp = page.match(this.reg.time);
    if (temp) {
      this.config.time = {
        hour: +temp[1],
        minute: +temp[2]
      };
      console.log(this.config.time);
    } else {
      console.error('Не нашел время!');
    }
  }

  getGold(page) {
    let temp = page.match(this.reg.gold);
    if (temp) {
      this.config.gold = +temp[1].replace(/,/g, '');
      console.log('Gold: ' + this.config.gold);
    } else {
      console.error('Не нашел золото!');
      console.error('Выкинуло!');
    }

    // Выкинуло нас или нет
    this.config.auth = !!temp;
  }

  getParamForBet() {
    this.getOneParam('minutesForBet', this.addresses.roulette.page);
    this.getOneParam('goldForBet', this.addresses.roulette.page);
  }

  getOneParam(name, page) {
    let temp = page.match(this.reg[name]);
    if (temp) {
      this.config[name] = temp[1];
      console.log(name + ': ' + this.config[name]);
    } else {
      console.error(name + ' not found!');
    }
  }

  checkBet(bet) {
    let temp = this.addresses.roulette.page.match(this.reg.checkBet);
    if (temp && temp[1] === '' + bet && temp[2] === '' + this.config.NUMBER) {
      this.log.push({ time: new Date(), bet: temp[1] });
      console.log('Поставлено ' + temp[1] + ' на ' + temp[2]);
    } else {
      console.error('Не поставлено');
    }
  }

  // get(url, cookie, obj, name) {
  //   let result;
  //   request.get({
  //     url,
  //     encoding: 'utf8',
  //     headers: Object.assign({ 'Cookie': cookie ? cookie.join(';') : '' }, this.headers, { 'Content-Type': 'text/html' })
  //   }, function (err, httpResponse, body) {
  //     if (err) {
  //       console.log('Error :' + err);
  //       return;
  //     }

  //     if (httpResponse.headers['set-cookie']) {
  //       this.searchCookie(httpResponse.headers['set-cookie']);
  //     }

  //     console.log('GET: ' + url);
  //     console.log('Headers: ' + httpResponse.headers);
  //     console.log('Status: ' + httpResponse.statusCode);
  //     console.log(body);
  //     obj[name] = body;
  //   });
  // }

  // post(url, cookie, form) {
  //   let result;
  //   request.post({
  //     url,
  //     form,
  //     headers: Object.assign({ 'Cookie': cookie ? cookie.join(';') : '' }, this.headers)
  //   }, (err, httpResponse, body) => {
  //     if (err) {
  //       console.log('Error :' + err);
  //       return;
  //     }

  //     if (httpResponse.headers['set-cookie']) {
  //       this.searchCookie(httpResponse.headers['set-cookie']);
  //     }

  //     result = body;
  //   });
  //   return result;
  // }

  searchCookie(header) {
    this.cookie = [];
    header.forEach((el) => {
      if (el.indexOf('deleted') === -1) {
        let temp;
        if (el.indexOf(';') === -1) {
          temp = el;
        } else {
          temp = el.split(';')[0];
        }
        this.cookie.push(temp);
      }
    });
    console.log('New coockie: ' + this.cookie.join(';'));
  }

  // async getPage(name, id = '') {
  //   this.get(this.addresses[name].url + id, this.cookie, this.addresses[name], 'page');
  // }

  // login(name, pass) {
  //   let temp = this.post(this.addresses.login, null, this.form);
  //   this.getPage('home');

  //   this.loginFlag = true; //Проверка 
  // }

}

module.exports = Bet;