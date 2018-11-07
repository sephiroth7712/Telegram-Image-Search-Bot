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
  var searchTerm=msg.text.toString().slice(9);
  var results = getImageSearchResults(searchTerm, callback, 0, 10,msg.chat.id,msg.message_id);
});

function callback(results,id,msgid) {

  if(results.length>0){
    var url=results[Math.floor(Math.random()*results.length)];
    var count=(url.link.match(/www/g)|| []).length;
    if(url.image.contextLink.includes('facebook')||url.image.contextLink.includes('youtube')){
      url=results[0].image.thumbnailLink;
    }
    else if(count>=2){
      var index=nthIndex(url.link,'www',2);
      url='https://'+url.link.toString().slice(index);
    }
    else{
      url=url.link;
    }
    try{
      bot.sendPhoto(id,url,{reply_to_message_id:msgid});
    } catch(error) {
      console.error(error)
    }
  }
  else{
    bot.sendMessage(id,'Image not found',{reply_to_message_id:msgid});
  }
}

function nthIndex(str, pat, n){
    var L= str.length, i= -1;
    while(n-- && i++<L){
        i= str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}



bot.on('message', (msg) => {
  var hi="hi";
  var bye = "bye";
  const name = msg.from.first_name;
  const username = msg.from.username;
  if(msg.text.toString().toLowerCase().indexOf(hi)===0||msg.text.toString().toLowerCase().indexOf('hey')==0||msg.text.toString().toLowerCase().indexOf('hello')==0){

    const reply='Hello, ' + name + ' (@'+username+')!';
    bot.sendMessage(msg.chat.id, reply,{reply_to_message_id:msg.message_id}).then(() => {
      // reply sent!
    });
  }
  if (msg.text.toString().toLowerCase().includes(bye)) {
    bot.sendMessage(msg.chat.id,"Goodbye, "+name+' (@'+username+')!',{reply_to_message_id:msg.message_id});
  }
});

function getImageSearchResults(searchTerm, callback, start, num,id,msgid) {
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
        callback(resultsArray,id,msgid);
      } else if(data.items) {
        data.items.forEach(function (item) {
          resultsArray.push(item);
        });
        callback(resultsArray,id,msgid);
      } else {
        callback([],id,msgid);
      }
    });
  });
}

module.exports = bot;
