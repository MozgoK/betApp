const request = require('request');
const iconv = require('iconv-lite');


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
        id: null,
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
      checkWin: /<div align=center><u>Выпало число <font color='(?:.+?)'><b>(.+?)<\/b><\/font><\/u><\/div><br>/,
      lastGame: /<a href='inforoul\.php\?id=(.+?)'>Прошлая игра<\/a><br><\/div>/,
      checkWinningGold: /Выигрыш<\/b><\/td>\s*<\/tr>\s*<tr><td class=wblight align=right><b>(?:.+?)<\/b><\/td><td class=wblight><a style='text-decoration:none;' href='pl_info\.php\?id=(?:.+?)'>(?:.+?)<\/a><\/td><td class=wblight>(?:.+?)<\/td><td class=wblight><b>(.+?)<\/b>/

    };

    this.config = {
      NUMBER: null,
      multiplier: null,
      rate: null,
      auth: false,
      win: false
    };

    this.users = {};
    this.log = [];

    this.timer = {
      id: null,
      on: false,
      needS: 0,
      seconds: 0,
      minutes: 0
    }

  }


  // Авторизация
  logIN(login, pass, bet, callback) {
    this.users[login] = pass;
    this.log = [];

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

      this.searchCookie(httpResponse.headers);

      this.getPage('home', (page) => {

        // Сделать ставку на 100
        if (bet && callback) this.makeBet(bet, callback);

        // if (callback) callback(page);

      });
    });
  }


  // Сделать ставку
  makeBet(bet, callback) {
    this.getPage('roulette', () => {

      this.getParamForBet();
      this.getLastGameID();

      if (this.config.minutesForBet && this.config.goldForBet) {

        this.config.rate = 
          this.config.rate === null
            ? +bet
            : Math.floor(this.config.rate * this.config.multiplier);

        if (this.config.rate > this.config.gold) {
          // Золота не хватает
          this.log.push({ time: this.getNowDate(), bet: 'золото закончилось' });
          this.logging('золото закончилось');
          return;
        }

        request.post({
          url: this.addresses.parlay.url,
          form: {
            'bet': this.config.rate,
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

          this.searchCookie(httpResponse.headers);

          this.getPage('roulette', () => {

            let result = this.checkBet(this.config.rate);
            if (callback) callback(result);

          });

        });
      } else {
        console.error('Нельзя поставить (скорей всего не подходит вермя)');
      }

    });
  }

  getPage(name, callback) {
    request.get({
      url: this.addresses[name].url + (this.addresses[name].id ? this.addresses[name].id : ''),
      encoding: null,
      headers: Object.assign({ 'Cookie': this.cookie.join(';') }, this.headers)
    }, (err, httpResponse, body) => {

      if (err) {
        console.error('Error: ' + err);
        return;
      }

      this.searchCookie(httpResponse.headers);

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
      // console.log(this.config.time);
    } else {
      console.error('Не нашел время!');
    }
  }

  getGold(page) {
    let temp = page.match(this.reg.gold);
    if (temp) {
      let newGold = +temp[1].replace(/,/g, '');

      if (this.config.gold !== newGold) {
        this.config.gold = newGold;
        this.logging('gold ' + this.config.gold);
      }

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
      // console.log(name + ': ' + this.config[name]);
    } else {
      this.config[name] = null;
      console.error(name + ' not found!');
    }
  }

  checkBet(bet) {
    let temp = this.addresses.roulette.page.match(this.reg.checkBet);
    if (temp && temp[1] === '' + bet && temp[2] === this.config.NUMBER.toString()) {
      this.log.push({ time: this.getNowDate(), bet: temp[1] });
      this.logging('Поставлено ' + temp[1] + ' на ' + temp[2]);

      // ЗАПУСКАЕМ ТАЙМЕР
      this.startTimer();
      return true;

    } else {
      console.error('Не поставлено');
      this.errorHandler('notMakeBet');
      return false;
    }
  }

  checkWin() {
    let temp = this.addresses.inforoul.page.match(this.reg.checkWin);
    if (temp && temp[1] === this.config.NUMBER.toString()) {
      this.logging(' — ПОБЕДА! —');
      return true;
    } else {
      this.logging(' — Не выпало! —');
      return false;
    }
  }

  checkWinningGold() {
    let temp = this.addresses.inforoul.page.match(this.reg.checkWinningGold);
    if (temp) {
      this.log[this.log.length - 1].winGold = temp[1];
    } else {
      console.error('Не нашел выигрыш!');
    }
  }

  getLastGameID() {
    let temp = this.addresses.roulette.page.match(this.reg.lastGame);
    if (temp) {
      this.config.lastGameID = +temp[1];
      this.addresses.inforoul.id = this.config.lastGameID;
    } else {
      console.error('Не нашел id последней игры!');
    }
  }

  fullCheckWin() {
    this.getPage('roulette', () => {

      this.getPage('inforoul', () => {
        this.config.win = this.checkWin();
        this.checkWinningGold();

        if (!this.config.win) {
          // Не выиграли -> продолжаем ставить
          this.makeBet(this.config.rate);
        }
      });

    });
  }



  errorHandler(type) {

  }


  startMakeBet(obj) {
    this.config.NUMBER = obj.number;
    this.config.multiplier = obj.multiplier;
    this.logIN(obj.login, obj.pass, obj.bet, obj.callback);
  }

  searchCookie(headers) {
    if (headers['set-cookie']) {
      let header = headers['set-cookie'];

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
      this.logging('new coockie: ' + this.cookie.join(';'));
    }
  }

  getNowDate() {
    return new Date((new Date).toString().replace(/GMT\+0000/, 'GMT+0300'));
  }


  // Функция старта таймера
  startTimer() {
    if (!this.config.time) {
      console.error('Нету времени!');
      return;
    }

    if (this.timer.on) {
      console.error('Таймер уже включен');
      return;
    }
    
    const minutes = +this.config.time.minute,
      seconds = this.getRandomInt(5, 30),
      remainderOfDivision = minutes % 10;

    this.timer.needS = (12 - remainderOfDivision) * 60 + seconds;
    this.timer.on = true;

    this.timer.id = setInterval(() => {
      this.timer.needS--;
      this.timerFunc(this.timer.needS);
    }, 1000);
  }

  // Фунция проверки и завершения таймера
  timerFunc(seconds) {
    if (seconds >= 0) {
      this.timer.seconds = seconds % 60;
      this.timer.minutes = Math.floor(seconds / 60);

    } else {
      this.stopTimer();

      // Делаем проверку
      this.fullCheckWin();
    }
  }

  stopTimer(flag) {
    clearInterval(this.timer.id);
    this.timer.needS = 0;
    this.timer.on = false;
    this.timer.seconds = 0;
    this.timer.minutes = 0;
    if (flag) this.logging('timer disabled');
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  logging(text) {
    if (this.config.time) {
      console.log(`${this.pipeTime(this.config.time.hour)}:${this.pipeTime(this.config.time.minute)} ~ ${text}`);
    } else console.log(` ~ ${text}`);
  }

  pipeTime(num) {
    let temp = num.toString();
    return num.toString().length === 1
      ? '0' + temp
      : temp;
  }

}

module.exports = Bet;