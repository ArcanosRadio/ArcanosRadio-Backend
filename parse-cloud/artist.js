var Utils = require('./utils');
var Artist = Parse.Object.extend("Artist");

function getArtistByName(artistName) {
    return new Parse.Query(Artist)
        .equalTo("artistName", artistName)
        .limit(1)
        .first();
}

function getArtistByTag(tag) {
    return new Parse.Query(Artist)
        .equalTo("tags", tag)
        .limit(1)
        .first();
}

Parse.Cloud.define("artistByName", function(request, response) {
    var artistName = request.params.artistName;
    if (!artistName || artistName.length == 0) {
        response.success(null);
        return;
    }

    var tag = Utils.tagsWithoutSpace(artistName);

    getArtistByTag(tag)
        .then(function(result) {
            if (result) {
                return result;
            }
            return Parse.Cloud.run('addArtist', { artistName: artistName, tag: tag });
        }).then(function(result) {
            response.success(result);
        }, function(error) {
            response.error(error);
        });
});

Parse.Cloud.define("addArtist", function(request, response) {
    var artistName = request.params.artistName;
    var tag = request.params.tag;

    var artist = new Artist();
    artist.set("artistName", artistName);
    artist.addUnique("tags", tag);

    artist.save().then(function(saved) {
        response.success(saved);
    }, function(error) {
        response.error(error);
    });
});
