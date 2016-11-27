var Utils = require('./utils');
var SHOUTCAST_URL = process.env.SHOUTCAST_URL;

Parse.Cloud.define('getShoutCastCurrentSong', function(request, res) {
    Parse.Cloud.useMasterKey();

    var randomGenerator = parseInt(Math.random() * new Date());

    Parse.Cloud.httpRequest({
        url: SHOUTCAST_URL + "&nocache=" + randomGenerator,
        headers: {
            'Authorization': process.env.SHOUTCAST_AUTH
        }
    }).then(function(httpResponse) {
        var matches = (/<SONGTITLE>(.*)<\/SONGTITLE>/g).exec(httpResponse.text) || ["", ""];
        var title = Utils.unescapeHtml(matches[1]);
        res.success(title);
    }, function(httpResponse) {
        res.error('Error fetching xml from radio at ' + new Date().toString());
    });
});
