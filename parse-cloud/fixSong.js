var _ = require("underscore");
var Utils = require('./utils');
var STATE_UNKNOWN = 0;
var STATE_ERROR = 1;
var STATE_NOT_FOUND = 2;
var STATE_DONE = 3;

function addLyricsToSong(songId) {
    return Parse.Cloud.run('songById', {
        songId: songId
    }).then(function(song) {
        if(!song.get("songName") || !song.get("artist") || !song.get("artist").get("artistName")) {
            song.set('lyrics', null);
            song.set('lyricsState', STATE_ERROR);
            return song.save();
        }

        var songName = song.get("songName");
        var artistName = song.get("artist").get("artistName");
        return Parse.Cloud.run('getLyricsParseFile', { songName: songName, artistName: artistName })
            .then(function(lyricsFile) {
                song.set('lyrics', lyricsFile);
                song.set('lyricsState', lyricsFile == null ? STATE_NOT_FOUND : STATE_DONE);
                return song.save();
            });
    });
}

Parse.Cloud.define("addLyricsToSong", function(request, response) {
    addLyricsToSong(request.params.songId)
        .then(function(song){
            response.success(song.get("songName") + " => " + song.get("lyrics"));
        }, function(err) {
            response.error(err);
        });
});

function songsWithoutLyricsState() {
    var Song = Parse.Object.extend("Song");
    return new Parse.Query(Song)
        .equalTo("lyricsState", STATE_UNKNOWN)
        .exists("artist")
        .select("objectId")
        .limit(20)
        .find();
}

Parse.Cloud.define("songsWithoutLyricsState", function(request, response) {
    songsWithoutLyricsState()
        .then(function(ids) {
            response.success(ids);
        }, function (err) {
            response.error(err);
        });
});

Parse.Cloud.define("fixSomeSongsWithoutLyricsState", function(request, response) {
    songsWithoutLyricsState()
    .then(function(ids) {
        var promises = [];
        _.each(ids, function(songId) {
            var songLyricsPromise = addLyricsToSong(songId.id)
                .then(function(song) {
                    response.success(song.get("songName") + " => " + song.get("lyrics"));
                }, function(err) {
                    response.error(err);
                });

            promises.push(songLyricsPromise);
        });

        return Parse.Promise.when(promises);
    }).then(function(results) {
        response.success(results);
    }, function (err) {
        response.error(err);
    });
});

Parse.Cloud.define("addAlbumArtToSong", function(request, response) {
    addAlbumArtToSong(request.params.songId, request.params.imageUrl)
        .then(function(results) {
            response.success(results);
        }, function (err) {
            response.error(err);
        });
});

function addAlbumArtToSong(songId, imageUrl) {
    return Parse.Cloud.run('songById', {
        songId: songId
    }).then(function(song) {
        if(!song.get("songName") || !song.get("artist") || !song.get("artist").get("artistName")) {
            song.set('albumArt', null);
            song.set('albumArtState', STATE_ERROR);
            return song.save();
        }

        var songName = song.get("songName");
        var artistName = song.get("artist").get("artistName");
        var fileName = Utils.tagsWithoutSpace(songName) + '_' + Utils.tagsWithoutSpace(artistName);

        return getImageFromUrl(imageUrl)
            .then(function(imageInfo) {
                var file = new Parse.File(fileName, { base64: imageInfo.imageBase64 }, imageInfo.contentType);
                return file.save();
            }).then(function(albumArtFile) {
                song.set('albumArt', albumArtFile);
                song.set('albumArtState', STATE_DONE);
                return song.save();
            });
    });
}

function getImageFromUrl(url) {
    return Parse.Cloud.httpRequest({
        url: url
    }).then(function(httpResponse) {
        return {
            imageBase64 : httpResponse.buffer.toString('base64'),
            contentType : httpResponse.headers['content-type']
        };
    });
}