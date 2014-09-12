var fs = require("fs")
  , ejs = require('ejs')
  , marked = require('marked')
  , extend = require('node.extend')
  , path = require('path')
  , express = require('express')
  , request = require('request')
  , app = express();


//load the templates
var template = {
  main: fs.readFileSync(process.cwd() + "/templates/index.html", "utf8"), 
  slides: fs.readFileSync(process.cwd() + "/templates/masters/default.html", "utf8")
};
var timer = Date.now();

app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/templates');
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public'))); //  "public" off of current is root

app.use('/deck', function(req, res, next){
  timer = Date.now();
  request(req.param('src'), function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //Get the name of the deck
      var _names = req.param('src').match(/[A-Z,a-z]+/g);
      var rawSlides = mdToHtmlArray(body);
      //combine
      var slides = rawSlides.map(function(slide, i){
        return ejs.render(template.slides, {
          content: slide.content
        });
      });
      res.deck = { 
        title: _names[_names.length - 2], 
        template: 'default', 
        content: slides.join("")
      }
      next();
    }else {
      //load default slide deck
      res.deck = {
        title: 'no data', 
        template: 'default', 
        content:"<section><h1>Deck not found</h1></section>"
      }
      next();
    }
  })

});

app.get('/deck', function (req, res) {
  console.log('generated deck in ' + (Date.now() - timer) + 'ms');
  res.render('index', res.deck);
});

var port = process.env.PORT || 3000;
app.listen(port);

console.log('Listening on port %d', port);


//functions

function mdToHtmlArray(markdown){
    var html = marked(markdown);
    
    //Array of values we need to prepend after the split
    var headers = html.match(/<h[1-6]/g); 
    
    //leave a marker for splitting
    html = html.replace(/<h[1-6]/g, '<========slide=========>'); 
    var slides = html.split("<========slide=========>"); 
    
    //element 0 is whitespace. artifact of split method
    slides.shift(); 
    
    slides = slides.map(function(s, i){
      //add proper header number back after it was lost in the replace
      return {
        'level': headers[i].slice(1),
        'content': headers[i] + s
      }; 
    });
    
    return slides;
  }

  




