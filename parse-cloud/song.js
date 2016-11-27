var Utils = require('./utils');
var Song = Parse.Object.extend("Song");
var STATE_UNKNOWN = 0;
var STATE_ERROR = 1;
var STATE_NOT_FOUND = 2;
var STATE_DONE = 3;

function getSongs(page) {
    return new Parse.Query(Song)
        .skip(page * 20)
        .limit(20)
        .find();
}

function getSongById(objectId) {
    return new Parse.Query(Song)
        .equalTo("objectId", objectId)
        .include("artist")
        .limit(1)
        .first();
}

function getSongByTag(tag) {
    return new Parse.Query(Song)
        .equalTo("tags", tag)
        .limit(1)
        .first();
}

Parse.Cloud.define("getSongs", function(request, response) {
    Parse.Cloud.useMasterKey();

    var page = request.params.page || 0;
    getSongs(page)
        .then(function(result) {
            response.success(result);
        }, function(err) {
            response.success(null);
        });
});

Parse.Cloud.define("songById", function(request, response) {
    Parse.Cloud.useMasterKey();

    var songId = request.params.songId;
    getSongById(songId)
        .then(function(song) {
            if (song) {
                response.success(song);
            } else {
                response.error("Not found");
            }
        }, function(err) {
            response.error("Not found");
        });
});

Parse.Cloud.define("songByTag", function(request, response) {
    Parse.Cloud.useMasterKey();

    var songName = request.params.tag;
    var artistName = '';
    var tag = Utils.tagsWithSpace(songName);
    if (tag.startsWith("masculino_")) { tag = "current_time"; }
    if (tag.startsWith("feminino_")) { tag = "current_time"; }
    if (tag.startsWith("radiosnet_")) { tag = "radiosnet_spot"; }

    getSongByTag(tag)
        .then(function(result) {
            if (result) {
                return result;
            }

            var fields = songName.split(/ \- /);
            if (fields.length == 2) {
                artistName = fields[0];
                songName = fields[1];
            } else if (fields.length == 3) {
                artistName = fields[1];
                songName = fields[2];
            }

            return Parse.Cloud.run('addSong', { songName: songName, artistName: artistName, tag: tag });
        }).then(function(result) {
            response.success(result);
        }, function(error) {
            response.error(error);
        });
});

Parse.Cloud.define("addSong", function(request, response) {
    Parse.Cloud.useMasterKey();

    var songName = request.params.songName;
    var artistName = request.params.artistName;
    var tag = request.params.tag;

    Parse.Cloud.run('artistByName', { artistName: artistName })
        .then(function(artist) {

            var albumPromise = Parse.Cloud.run('getAlbumImageParseFile', { songName: songName, artistName: artistName });

            return albumPromise
                .then(function(albumResult) {
                    return {
                        artist: artist,
                        album: albumResult
                    };
                });
        })
        .then(function(songData) {
            var img = songData.album;
            var artist = songData.artist;

            var song = new Song();
            song.set("songName", songName);
            song.set('artist', artist);
            song.set('albumArt', img);
            song.set('albumArtState', img == null ? STATE_NOT_FOUND : STATE_DONE);
            song.set('lyrics', null);
            song.set('lyricsState', STATE_UNKNOWN);
            song.addUnique("tags", tag);
            return song.save();
        }).then(function(saved) {
            response.success(saved);
        }, function(error) {
            response.error(error);
        });
});