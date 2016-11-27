var jsdom = require("jsdom");
var Utils = require('./utils');
var _ = require("underscore");
var LYRICS_SEARCH_API = process.env.LYRICS_SEARCH_API;
var LYRICS_PREFIX = process.env.LYRICS_PREFIX;

Parse.Cloud.define('getLyricsParseFile', function(request, response) {
    Parse.Cloud.useMasterKey();

    getLyricsParseFile(request.params.songName, request.params.artistName)
        .then(function(lyrics) {
            response.success(lyrics);
        }, function(err) {
            response.success(null);
        });
});

function getLyricsUrl(songName, artistName) {
    if (!songName || !artistName) {
        return Parse.Promise.error('Song name or artist name not provided');
    }

    var query = Utils.encode(Utils.removeAccents(songName)) + '+' + Utils.encode(Utils.removeAccents(artistName));
    var requestUrl = LYRICS_SEARCH_API + query;

    return Parse.Cloud.httpRequest({
        url: requestUrl,
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    }).then(function(httpResponse) {
        var json = eval(httpResponse.text.replace(/\n/g, ' ').replace(/LetrasSug\(/g, '('));

        if (!json || !json.response || !json.response.docs) {
            return Parse.Promise.error('Invalid json data: ' + httpResponse.text);
        }

        var lyricsUrl = "";

        var tagSong = Utils.tagsWithoutSpace(songName);
        var tagArtist = Utils.tagsWithoutSpace(artistName);

        for (var i in json.response.docs) {
            var doc = json.response.docs[i];

            if (lyricsUrl == "") {
                lyricsUrl = doc.dns + '/' + doc.url + '/';
            }

            if (Utils.tagsWithoutSpace(doc.txt) == tagSong && Utils.tagsWithoutSpace(doc.art) == tagArtist) {
                lyricsUrl = doc.dns + '/' + doc.url + '/';
                if (doc.t == '2') {
                    break;
                }
            }
        }

        if (!lyricsUrl) {
            return Parse.Promise.error('Invalid json data: ' + httpResponse.text);
        }

        return LYRICS_PREFIX + lyricsUrl;
    });
}

function getLyrics(songName, artistName) {
    return getLyricsUrl(songName, artistName)
        .then(function(lyricsUrl) {
            return Parse.Cloud.httpRequest({
                url: lyricsUrl
            });
        }).then(function(httpResponse) {
            return extractLyrics(httpResponse.text);
        });
}

function getLyricsParseFile(songName, artistName) {
    return getLyrics(songName, artistName)
        .then(function(lyricsString) {
            var fileName = Utils.tagsWithoutSpace(songName) + '_' + Utils.tagsWithoutSpace(artistName) + '.txt';
            var lyricsBinary = Utils.getBytes(lyricsString);

            var file = new Parse.File(fileName, lyricsBinary);
            return file.save();
        });
}

function extractLyrics(html) {
    var promise = new Parse.Promise();

    jsdom.env(
        html,
        function (err, window) {
            if (err) {
                promise.reject(err);
                return;
            }
            var lyricsString = window.document
                .getElementsByClassName("cnt-letra")[0]
                .children[0]
                .innerHTML
                .replace(/<p[^>]*>/g, '\n')
                .replace(/<\/p>/g, '\n')
                .replace(/<br[^>]*>/g, '\n')
                .replace(/<[\/]*[biu][^>]*>/g, '')
                .trim();
            window.close();
            promise.resolve(lyricsString);
        }
    );

    return promise;
}