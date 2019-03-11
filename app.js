const express = require('express');
const path = require('path');
const port     = process.env.PORT || 8000;
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const redis = require('redis');
const mongoose = require('mongoose');
const Data = require('./data.js'); //data model

const app = express();

//Redis Connection
const client = redis.createClient();
const sub = redis.createClient();
const pub = redis.createClient();

//Subscribing to the channel
sub.subscribe("channel");

//Mongoose Connection
mongoose.connect('mongodb://localhost/mnr');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//Redis Connection Check
client.on('connect', function() {
  console.log('Redis client connected');
});

client.on('error', function (err) {
  console.log('Something went wrong ' + err);
});

//Will trigger if a message is received
sub.on("message", function (channel, message) {
    console.log("Message from channel: " + channel + "- " + message);
    //Read data from redis
    client.get('data', function (error, data) {
      if (error) {
        console.log(error);
      }
      //create new instance of Data
      let newData = new Data(JSON.parse(data));
      //save data in mongoDB
      newData.save().then(() => {
        //Delete data from redis
        client.del('data');
      }).catch((error) => {
        console.log(error);
      })
    });
});

//Home Page
app.get('/', (req, res) => {
  res.render('index.ejs');
})

//Post route
app.post('/postdata', (req, res) => {
  //Convert to string and save in redis
  client.set('data', JSON.stringify(req.body));
  //Publish a message
  pub.publish("channel", "New data arrived.");
  res.send(true);
})

//Get route
app.get('/getdata', (req, res) => {
  //Find all records in mongodb
  Data.find({}).then((data) => {
    res.json(data);
  }).catch((error) => {
    console.log(error);
  })
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);
});

app.listen(port, function(){
  console.log('Server is now running at port: ' + port);
});

module.exports = app;
