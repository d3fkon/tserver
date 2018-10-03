const axios = require('axios')
const moment = require('moment')
const HTTP = require('https')
const fs = require('fs')
const Blackops = 504462
const Fortnite = 33214
const gameId = Fortnite
const number = 20
const clientId = 'q6dewu8v14aitsl6pj9c38jgvv4scb'
const today = moment().startOf('day').seconds(0).millisecond(0).toISOString()
const tomorrow = moment().endOf('day').seconds(0).millisecond(0).toISOString()
const BASE_URL = 'https://clips-media-assets2.twitch.tv/AT-cm%7C';
const MP4 = '.mp4'

const downloadFile = (url, index) => {
    const file = fs.createWriteStream(index+MP4)
    console.log('Downloading: ' + url.split('-preview-')[0] + MP4)
    return new Promise((resolve, reject) => {
        const req = HTTP.get(url.split('-preview-')[0] + MP4, (res) => {
            res.pipe(file)
            const len = parseInt(res.headers['content-length'], 10)
            const total =  len / 1048576;
            res.on('data', chunk => {
            })
            res.on('end', () => {
                console.log(url.split('-preview-')[0] + MP4)
                resolve()
            })
            res.on('error', () => {
                reject('Error Downloading: ' + url.split('-preview-')[0] + MP4)
            })
        })
    })
}

const handleResponse = async () => {
    let videoIdDict = process.argv.slice(2)
    await Promise.all(videoIdDict.map(downloadFile))
}

handleResponse()


//https://clips-media-assets2.twitch.tv/AT-cm%7C30357473056-offset-10494-360.mp4





    //https://clips-media-assets2.twitch.tv/AT-cm%7C309168248-preview-260x147.jpg 31d6cfe0d16ae931b73c
    //https://clips-media-assets2.twitch.tv/AT-cm%7C309168248-360.mp4

    //https://clips-media-assets2.twitch.tv/30355314720-offset-2702-preview-260x147.jpg
    //https://clips-media-assets2.twitch.tv/AT-cm%7C30355314720-offset-2702-360.mp4

    //https://clips-media-assets2.twitch.tv/AT-cm%7C309003387-preview-260x147.jpg

    //https://clips-media-assets2.twitch.tv/AT-cm%7C309256686-preview-260x147.jpg

    // https://clips-media-assets2.twitch.tv/AT-cm%7C309256686.mp4


    // COD: 504462
    // Fortnite: 33214  