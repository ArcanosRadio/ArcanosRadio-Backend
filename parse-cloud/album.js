var Utils = require('./utils');
var ALBUM_ART_SEARCH_API = process.env.ALBUM_ART_SEARCH_API;

Parse.Cloud.define("getAlbumImageUrl", function(request, response) {
    getAlbumImageUrl(request.params.songName, request.params.artistName)
        .then(function(url) {
            response.success(url);
        }, function(err) {
            response.error(err);
        });
});

Parse.Cloud.define("getAlbumImage", function(request, response) {
    getAlbumImage(request.params.songName, request.params.artistName)
        .then(function(img) {
            response.success(img);
        }, function(err) {
            response.error(err);
        });
});

Parse.Cloud.define("getAlbumImageParseFile", function(request, response) {
    getAlbumImageParseFile(request.params.songName, request.params.artistName)
        .then(function(img) {
            response.success(img);
        }, function(err) {
            response.success(null);
        });
});


function getAlbumImageUrl(songName, artistName) {
    var query = '';
    if (songName) query += Utils.encode(songName);
    if (songName && artistName) query += '+';
    if (artistName) query += Utils.encode(artistName);

    if (query == '') {
        return Parse.Promise.error('Song name and artist name not provided');
    }

    var requestUrl = ALBUM_ART_SEARCH_API + query;

    return Parse.Cloud.httpRequest({
        url: requestUrl,
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    }).then(function(httpResponse) {
        var json = httpResponse.data;
        if (!json) {
            return Parse.Promise.error('Invalid json data: ' + httpResponse.text);
        }

        var imgUrl = json['tracks']['items'][0]['album']['images'][0]['url'];
        if (!imgUrl) {
            return Parse.Promise.error('Invalid json node: ' + httpResponse.text);
        }

        return imgUrl;
    });
}

function getAlbumImage(songName, artistName) {
    return getAlbumImageUrl(songName, artistName)
        .then(function(imageUrl) {
            return Parse.Cloud.httpRequest({
                url: imageUrl
            });
        });
}

function getAlbumImageParseFile(songName, artistName) {
    return getAlbumImage(songName, artistName)
        .then(function(httpResponse) {
            var fileName = Utils.tagsWithoutSpace(songName) + '_' + Utils.tagsWithoutSpace(artistName);
            var image = httpResponse.buffer.toString('base64');
            var contentType = httpResponse.headers['content-type'];

            var file = new Parse.File(fileName, { base64: image }, contentType);
            return file.save();
        });
}
