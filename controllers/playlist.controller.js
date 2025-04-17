const { Playlist } = require('../models/config')
const { Music } = require('../models/config')
const { Like } = require('../models/config')


const playlistController = {
    async createPlaylist(playlistName, music_id, user_id) {
        try {
            const playlist = await Playlist.create({
                playlistName,
                music_id,
                user_id
            });
            console.log('Playlist created:', playlist);
            return playlist;
        } catch (error) {
            console.error('Error creating playlist:', error);
            throw error;
        }
    },

    async getPlaylistByName(playlistName) {
        try {
            const playlist = await Playlist.findAll({
                where: { playlistName },
                include: [{ model: Music, attributes: ['id', 'songName', 'artist', 'musicResource', 'songImg'], }],
                order: [['createdAt', 'ASC']]
            });
            // console.log('Playlist fetched:', playlist);
            return playlist;
        } catch (error) {
            console.error('Error fetching playlist:', error);
            throw error;
        }
    },

    async getAllPlaylists(_user_id) {
        try {
            const playlists = await Playlist.findAll({
                where: { user_id: _user_id },
                include: [{ model: Music, attributes: ['id', 'songName', 'artist'] }]
            });
            const playlistData = playlists.map(playlist => {
                return {
                    id: playlist.id,
                    playlistName: playlist.playlistName,
                    music_id: playlist.music_id,
                    createdAt: playlist.createdAt,
                    user_id: playlist.user_id,
                    Music: {
                        id: playlist.Music.id,
                        songName: playlist.Music.songName,
                        artist: playlist.Music.artist
                    }
                };
            });
            return playlistData;

        } catch (error) {
            console.error('Error fetching playlists:', error);
            throw error;
        }
    },

    async deletePlaylist(playlistId) {
        try {
            const result = await Playlist.destroy({
                where: { playlistName: playlistId }
            })
            if (result === 0) {
                throw new Error('Playlist not found');
            }
            console.log('Playlist deleted:', result);
        }
        catch (error) {
            console.error('Error deleting playlist:', error);
            throw error;
        }
    },

    async deleteSongFromPlaylist(playlistName, music_id) {
        try {
            const result = await Playlist.destroy({
                where: { playlistName, music_id }
            })
            if (result === 0) {
                throw new Error('Song not found in playlist');
            }
            console.log('Song deleted from playlist:', result);
        } catch (error) {
            console.error('Error deleting song from playlist:', error);
            throw error;
        }
    },

    // async getMusicResource(music_id) {
    //     try {
    //         const music = await Music.findOne({
    //             where: { id: music_id },
    //             attributes: ['musicResource']
    //         });
    //         return music;
    //     } catch (error) {
    //         console.error('Error fetching music resource:', error);
    //         throw error;
    //     }
    // }

    // async getMusicResources(playlistName) {
    //     try {
    //         const musicReources = await Playlist.findAll({
    //             where: { playlistName },
    //             attributes: ['music_id'],
    //             include: [{ model: Music, attributes: ['musicResource'] }],
    //             order: [['createdAt', 'ASC']]
    //         });
    //         return musicReources;
    //     } catch (error) {
    //         console.error('Error fetching music resources:', error);
    //         throw error;
    //     }
    // }

    // 유저 별로 좋아요한 곡의 수 가져오기
    async getUserLikeCount(userId) {
        try {
            const count = await Like.count({
                where: { user_id: userId }
            });
            return count;
        } catch (error) {
            console.error('Error fetching user like count:', error);
            throw error;
        }
    }
}


module.exports = playlistController;