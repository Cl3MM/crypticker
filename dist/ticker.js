'use strict';function _asyncToGenerator(fn) {return function () {var gen = fn.apply(this, arguments);return new Promise(function (resolve, reject) {function step(key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {return Promise.resolve(value).then(function (value) {step("next", value);}, function (err) {step("throw", err);});}}return step("next");});};}require('babel-polyfill');
var Promise = require('bluebird');
var chromium = require('chromium');
var moment = require('moment');
var Primus = require('primus');
var WS_NAME = process.env.WS_NAME || 'crypticker_srv';
var WS_PORT = process.env.WS_PORT || 3000;
var ws = 'ws://\'' + WS_NAME + ':' + WS_PORT;
var Socket = Primus.createSocket();
var client = new Socket(ws);

// c o nst CHROME_PATH = '/usr/bin/chromium-browser'
// process.env.CHROME_PATH = CHROME_PATH
// console.log(CHROME_PATH)
// c o ns t path = require('path')
process.env.PHANTOMJS_EXECUTABLE = '/usr/local/bin/phantomjs';
console.log(process.env.PHANTOMJS_EXECUTABLE);
process.env.CHROME_PATH = chromium.path;
process.env.NICKJS_NO_SANDBOX = 1;
console.log(chromium.path);

var Nick = require("nickjs");
var nick = new Nick({
  //  printNavigation: false,
});
console.log('[+] Nick OK');
var goGetACrypt = function () {var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {var tab;return regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
            console.log('[+] starting new tab...');_context.next = 3;return (
              nick.newTab());case 3:tab = _context.sent;
            console.log('[+] opening bitinfocharts...');_context.next = 7;return (
              tab.open('https://bitinfocharts.com/cryptocurrency-exchange-rates/#EUR'));case 7:_context.next = 9;return (
              tab.untilVisible("tr.ptr"));case 9:
            console.log('[+] evaluating...');return _context.abrupt('return',
            tab.evaluate(function (arg, callback) {
              var ar = [];
              $('tr.ptr').each(function () {
                $(this).trigger('mouseover');
                $('.popover-content table tr:not(:first)').each(function () {
                  if ($(this).find('td').length < 4) return;
                  var buy = $(this).find('td.smlr:first').text();
                  var sell = $(this).find('td.smlr:last').text();
                  var mkt = $(this).find('td:nth-child(2) a').text();
                  var inst = $(this).find('td:first a').text();
                  ar.push({
                    mkt: mkt,
                    inst: inst,
                    buy: buy,
                    sell: sell });

                });
              });
              callback(null, ar);
            }).
            then(function (data) {
              if (!data || !data[0]) {
                console.log('no results found');
                nick.exit();
                return;
              }
              var re = new RegExp(/^(.*) \w+$/i);
              var now = moment.utc();
              var cryptos = data.map(function (mkt) {
                mkt.buy = mkt.buy.match(re) ? mkt.buy.match(re)[1].replace(',', '') : mkt.buy;
                mkt.sell = mkt.sell.match(re) ? mkt.sell.match(re)[1].replace(',', '') : mkt.sell;
                mkt.time = now.toISOString();
                return mkt;
              });
              console.log('[+] found ' + data.length + ' data points');
              client.write({
                action: 'tick',
                data: cryptos });

              nick.exit();
            }));case 11:case 'end':return _context.stop();}}}, _callee, undefined);}));return function goGetACrypt() {return _ref.apply(this, arguments);};}();


goGetACrypt().
catch(function (err) {
  console.log('Something went terribly wrong: ' + err);
  nick.exit(1);
});