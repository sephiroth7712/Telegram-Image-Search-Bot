const token = process.env.TOKEN;
const request = require('request');
const Bot = require('node-telegram-bot-api');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

var https = require('https');
require('dotenv').config();
//var imageSearch = require('node-google-image-search');




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
  /*requestString='https://unsplash.com/search/photos/'+searchTerm;
    request(requestString, function (error, response) { // Get the search results of bing
        var html = new JSDOM(response.body); // Parse the response
        var images = html.window.document.getElementsByClassName('_2zEKz'); // Get all images - in this case by class name, otherwise we would get profile pictures too
        var sources = []; // Array to pick random url from
        for (var i = 0; i < images.length; i++) { // Loop through all images and push only valid url to the array
            if (images[i].src.includes('https')) {
                sources.push(images[i].src);
            }
        }
        // Check if the array containing the url has any values
        if (typeof sources[0] !== "undefined") {
            bot.sendPhoto(msg.chat.id, sources[Math.floor(Math.random() * sources.length)]); // Random url as parmeter
        } else {
            bot.sendMessage(msg.chat.id, "⚠️ Sorry, I couldn't find any image for "+searchTerm+". ⚠️");
        }
    });*/
    var results = getImageSearchResults(searchTerm, callback, 0, 5,msg.chat.id);
    //console.log(results[0].link);
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
        // check for usage limits (contributed by @ryanmete)
        // This handles the exception thrown when a user's Google CSE quota has been exceeded for the day.
        // Google CSE returns a JSON object with a field called "error" if quota is exceed.
      if(data.error && data.error.errors) {
        resultsArray.push(data.error.errors[0]);
        // returns the JSON formatted error message in the callback
        callback(resultsArray,id);
      } else if(data.items) {
        // search returned results
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
module.exports = getImageSearchResults;
