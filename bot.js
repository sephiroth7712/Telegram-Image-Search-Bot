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

bot.onText(/\/imageof/,(msg) => {
  bot.sendMessage(msg.chat.id,"Enter Search Term for Image",{reply_to_message_id:msg.message_id,reply_markup:{"force_reply":true}});
});


string_to_array = function (str) {
     return str.trim().split(" ");
};

function callback(results,id,msgid,gsr) {
  var temp=Math.floor(Math.random()*results.length);
  if(results.length>0){
    var url=results[temp];
    // console.log(url);
    if(url.link==undefined){
      bot.sendMessage(id,'Error',{reply_to_message_id:msgid});
    }
    var count=(url.link.match(/www/g)|| []).length;
    if(url.image.contextLink.includes('facebook')||url.image.contextLink.includes('youtube')||url.image.contextLink.includes('twitter')){
      url=results[temp].image.thumbnailLink;
    }
    else if(count>=2){
      var index=nthIndex(url.link,'www',2);
      url='https://'+url.link.toString().slice(index);
    }
    else{
      url=url.link;
    }
    try{
      bot.sendPhoto(id,url,{parse_mode:'Markdown',caption:'[Google Image Search Results]('+gsr+')', reply_to_message_id:msgid});
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
  else if (msg.text.toString().toLowerCase().includes(bye)) {
    bot.sendMessage(msg.chat.id,"Goodbye, "+name+' (@'+username+')!',{reply_to_message_id:msg.message_id});
  }
  if(msg.reply_to_message!=undefined){
    if((msg.reply_to_message.from.id==791119811)&&(msg.reply_to_message.text.toString().toLowerCase()=='enter search term for image')){
    var searchTerm=msg.text.toString();
    var temp=string_to_array(searchTerm);
    var gsr='https://www.google.co.in/search?q='+temp[0];
    not=temp.length;
    if(not>1){
      for(var i=1;i<not;i++){
        gsr=gsr+'+'+temp[i];
      }
    }
    gsr+='&tbm=isch&source=lnms&sa=X&ved=0ahUKEwjurPut1cLeAhWDF3IKHT1JDm0Q_AUICygC&biw=1853&bih=953&dpr=1'
    var results = getImageSearchResults(searchTerm, callback, 0, 10,msg.chat.id,msg.message_id,gsr);
  }}

});

function getImageSearchResults(searchTerm, callback, start, num,id,msgid,gsr) {
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
        callback(resultsArray,id,msgid,gsr);
      } else if(data.items) {
        data.items.forEach(function (item) {
          resultsArray.push(item);
        });
        callback(resultsArray,id,msgid,gsr);
      } else {
        callback([],id,msgid,gsr);
      }
    });
  });
}

module.exports = bot;
