const token = process.env.TOKEN;
const request = require('request');
const Bot = require('node-telegram-bot-api');

var https = require('https');

let bot;

if(process.env.NODE_ENV === 'production') {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
}
else {
  bot = new Bot(token, { polling: true });
}


console.log('Bot server started in the ' + process.env.NODE_ENV + ' mode');
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome!");
});


bot.onText(/^\/imageof (.+)$/, (msg, props) => {
  console.log('message request = ');
  var searchTerm=msg.text.toString().slice(9);
  console.log(searchTerm);
  var results = getImageSearchResults(searchTerm, callback, 0, 5,msg.chat.id);
});

function callback(results,id) {
    url=results[0].link;
    bot.sendPhoto(id,url);
}

bot.on('message', (msg) => {
  //console.log(msg);
  var hi="hi";
  var bye = "bye";
  var nigger = ['nigga','nigger','nibba'];
  if(msg.text.toString().toLowerCase().indexOf(hi)===0){
    const name = msg.from.first_name;
    const username = msg.from.username;
    const reply='Hello, ' + name + ' (@'+username+')!';
    bot.sendMessage(msg.chat.id, reply).then(() => {
      // reply sent!
    });
  }
  if (msg.text.toString().toLowerCase().includes(bye)) {
    bot.sendMessage(msg.chat.id, "Die Nigger");
  }
  if(nigger.includes(msg.text.toString().toLowerCase())){
    bot.sendMessage(msg.chat.id, "Niggers should die");
  }
});

function getImageSearchResults(searchTerm, callback, start, num,id) {
  start = start < 0 || start > 90 || typeof(start) === 'undefined' ? 0 : start;
  num = num < 1 || num > 10 || typeof(num) === 'undefined' ? 10 : num;

  if (!searchTerm) {
    console.error('No search term');
  }

  var parameters = '&q=' + encodeURIComponent(searchTerm);
  parameters += '&searchType=image';
  parameters += start ? '&start=' + start : '';
  parameters += '&num=' + num;

  var options = {
    host: 'www.googleapis.com',
    path: '/customsearch/v1?key=' + process.env.CSE_API_KEY + '&cx=' + process.env.CSE_ID + parameters
  };

  var result = '';

  https.get(options, function(response) {
    response.setEncoding('utf8');

    response.on('data', function(data) {
      result += data;
    });

    response.on('end', function () {
      var data = JSON.parse(result);
      var resultsArray = [];
      if(data.error && data.error.errors) {
        resultsArray.push(data.error.errors[0]);
        callback(resultsArray,id);
      } else if(data.items) {
        data.items.forEach(function (item) {
          resultsArray.push(item);
        });
        callback(resultsArray,id);
      } else {
        callback([],id);
      }
    });
  });
}

module.exports = bot;
