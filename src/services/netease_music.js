import mongoose from 'mongoose'
import util from 'util'
import querystring from 'querystring'
import superagentDefaults from 'superagent-defaults'
import superagent from 'superagent'
import config from '../config'

var neteaseRequest = superagentDefaults()
neteaseRequest.set('Referer', 'http://music.163.com/')


const neteaseMusic = {
    getSong: async (id)=> {
        let j = await neteaseRequest.get(`http://music.163.com/api/song/detail/?id=${id}
            &ids=[${id}]&csrf_token=`)
            .set('Referer', 'http://music.163.com/')
        j = JSON.parse(j.res.text)
        return getSongInfo(j['songs'][0])
    },

    getAlbum: async (id)=> {
        let j = await neteaseRequest.get(`http://music.163.com/api/song/detail/?id=${id}
            &ids=[${id}]&csrf_token=`)
            .set('Referer', 'http://music.163.com/')
        j = JSON.parse(j.res.text)
        return getSongInfo(j['songs'][0])
    },

    search: async (key)=> {
        const songParams = { type: 1, offset: 0, limit: 50, sub: false, s: key }
        const albumParams = { type: 10, offset: 0, limit: 50, sub: false, s: key }
        const panelParams = { type: 1000, offset: 0, limit: 50, sub: false, s: key }
        const mvParams = { type: 1004, offset: 0, limit: 50, sub: false, s: key }
        const radioParams = { type: 1009, offset: 0, limit: 50, sub: false, s: key }

        //const neteaseRequest = neteaseRequest.set('Referer', 'http://music.163.com/'),

        const arr = await Promise.all([
            neteaseRequest.post(`http://music.163.com/api/search/get/?${querystring.stringify(songParams)}`)
                .set('Referer', 'http://music.163.com/'),
            neteaseRequest.post(`http://music.163.com/api/search/get/?${querystring.stringify(albumParams)}`)
                .set('Referer', 'http://music.163.com/'),
            neteaseRequest.post(`http://music.163.com/api/search/get/?${querystring.stringify(panelParams)}`)
                .set('Referer', 'http://music.163.com/'),
            neteaseRequest.post(`http://music.163.com/api/search/get/?${querystring.stringify(mvParams)}`)
                .set('Referer', 'http://music.163.com/'),
            neteaseRequest.post(`http://music.163.com/api/search/get/?${querystring.stringify(radioParams)}`)
                .set('Referer', 'http://music.163.com/')
        ])

        return {
            songs: JSON.parse(arr[0].res.text).result.songs,
            albums: JSON.parse(arr[1].res.text).result.albums,
            panels: JSON.parse(arr[2].res.text).result.playlists,
            mvs: JSON.parse(arr[3].res.text).result.mvs,
            radios: JSON.parse(arr[4].res.text).result.djprograms,
        }
    }
}

function encryptedId(dfsId) {
    const byte1 = '3go8&$8*3*3h0k(2)2'
    const byte2 = dfsId.toString()
    const byte1_len = byte1.length
    const arr = byte2.split('').map((c,i) => {
        return byte2.charCodeAt(i) ^ byte1[i%byte1_len].charCodeAt(0)
    })
    const newByte2 = String.fromCharCode.apply({}, arr)
    return Util.md5(newByte2, 'base64')
}

function makeUrl(songNet, dfsId) {
    const encId = encryptedId(dfsId)
    return `http://${songNet}/${encId}/${dfsId}.mp3`
}

function getSongInfo(song) {
    let songNet = song.mp3Url.split('/')[2]
    return {
        url_best: makeUrl(songNet, song.hMusic.dfsId) || song.mp3Url || makeUrl(songNet, song.bMusic.dfsId),
        title: song['name'],
        album: song['album']['name'],
        pic_url: song['album']['picUrl'],
        artist: song['artists'][0]['name']
    }
}

export default neteaseMusic 
