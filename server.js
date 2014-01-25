console.log("starting");
var port = process.env.PORT || 5000;
process.env.PWD = process.cwd()

var express = require("express"),
    stylus = require("stylus"),
    app = express();

app.use(stylus.middleware(__dirname));
app.use(express.static(process.env.PWD));
app.get("/", function(request, response) {
  response.sendfile('index.html');
});

app.listen(port);
