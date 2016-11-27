var Playlist = Parse.Object.extend("Playlist");

function getPlaylistLastSong() {
    return new Parse.Query(Playlist)
        .descending("createdAt")
        .limit(1)
        .first();
}

function radioDidStartSong(currentSongTitle) {
    return Parse.Cloud.run('songByTag', { tag: currentSongTitle })
        .then(function(song) {
            var playlist = new Playlist();
            playlist.set("title", currentSongTitle);
            playlist.set("song", song);
            return playlist.save();
        });
}

Parse.Cloud.define('updateCurrentSong', function(request, res) {
    Parse.Cloud.useMasterKey();

    Parse.Promise
        .when([
            Parse.Cloud.run('getShoutCastCurrentSong'),
            getPlaylistLastSong()
        ]).then(function(results) {
            var shoutcastLastSong = results[0];
            var playlistLastSong = results[1];

            if (playlistLastSong && playlistLastSong.get("title") === shoutcastLastSong) {
                return null;
            }

            return radioDidStartSong(shoutcastLastSong);
        }).then(function(playlistItem) {
            if (!playlistItem) {
                res.success('Same song');
                return;
            }

            res.success('New song: ' + playlistItem.get('title'));
        }, function(error) {
            res.error(error);
        });
});