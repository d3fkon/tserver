const express = require('express')
const bodyParser = require('body-parser')
const sys = require('sys')
const exec = require('child_process').exec
const moment = require('moment')
const HTTP = require('https')
const fs = require('fs')
const MP4 = '.mp4'
let intermediateArr = []
let counter = 1
let isDownloading = false
let isConcat = false
let currentlyDownloading = []
let currentStatus = ''

const downloadFile = (url, index) => {
    const file = fs.createWriteStream(index + MP4)
    console.log('Downloading: ' + url.split('-preview-')[0] + MP4)
    return new Promise((resolve, reject) => {
        const req = HTTP.get(url.split('-preview-')[0] + MP4, (res) => {
            res.pipe(file)
            const len = parseInt(res.headers['content-length'], 10)
            const total = len / 1048576;
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
const intermediateFileName = fileName => `${counter++}.ts`
const concat = async () => {
    const files = fs.readdirSync('.').filter(file => file.split('.').pop() === 'mp4')
    try {
        await Promise.all(files.map(async (file) => {
            try {
                await mp4ToTs(file)
            }
            catch (e) {
                console.log(e)
                return false
            }
        }))
        console.log('Awating TS Completion')
        setTimeout(async () => {
            console.log('Merging')
            await merge('VOD.mp4')
            return true
        }, 2000)
    }
    catch (e) {
        return false
        console.log(e)
    }
}
const cmdConcatFiles = outputFileName => {
    if (intermediateArr.length === 0) {
        console.log('No files to concatenate')
        return;
    }
    let intermediateFileOrder = ''
    intermediateArr.sort(sortFiles)

    intermediateArr.forEach((fileName) => intermediateFileOrder += (fileName + '|'))
    intermediateFileOrder = intermediateFileOrder.slice(0, -1)
    return `ffmpeg -i "concat:${intermediateFileOrder}" -c copy -bsf:a aac_adtstoasc ${outputFileName}`
}
const formatToInt = file => parseInt(file.split('.')[0])

const sortFiles = (a, b) => {
    a = formatToInt(a)
    b = formatToInt(b)
    if (a < b) return -1
    if (a > b) return 1
    return 0
}

const cmdInputToInter = (fileName) => {
    const iFileName = intermediateFileName(fileName)
    return {
        cmd: `ffmpeg -i ${fileName} -c copy -bsf:v h264_mp4toannexb -f mpegts ${iFileName} -nostats -loglevel 0`,
        iFileName
    }
}
const mp4ToTs = fileName => {
    return new Promise((res, rej) => {
        const { cmd, iFileName } = cmdInputToInter(fileName)
        console.log(cmd)
        let c = exec(cmd, (err, stdout, stderr) => {
            console.log(stderr)
        })
        c.on('exit', code => {
            if (code !== 0) {
                console.log(err)
                rej('Failed to convert to ts: ' + fileName)
            } else {
                if (code === 0) {
                    intermediateArr.unshift(iFileName)
                    res()
                }
            }
        })
    })
}

const merge = fileName => {
    intermediateArr.sort(sortFiles)
    const cmd = cmdConcatFiles(fileName)
    console.log(cmd)
    return new Promise((res, rej) => {
        let c = exec(cmd, (err, stdout, stderr) => {
            console.log(err)
        })
        c.on('exit', code => {
            if (code !== 0) return rej('Error merging files')
            return res()
        })
    })
}


const downloadStateManager = async videoIdDict => {
    isDownloading = true
    currentlyDownloading = videoIdDict
    await Promise.all(videoIdDict.map(downloadFile))
    isDownloading = false
    currentlyDownloading = []
}

const concatStateManager = async () => {
    intermediateArr = []
    isConcat = true
    res = await concat()
    isConcat = false
    if (!res) {
        currentStatus = 'concat Failed'
    } else {
        currentStatus = 'concat Success'
    }
}

app = express()
app.use(bodyParser.urlencoded({ extended: false }))

app.post('/download', async (req, res) => {
    if (isDownloading)
        return res.send({ downloading: true, downloadStarted: false })
    ids = req.body.ids
    let videoIdDict = ids.split('|');
    downloadStateManager(videoIdDict)
    return res.send({ downloading: true, downloadStarted: true })
})
app.get('/check', async (req, res) => {
    res.send({
        downloading: isDownloading,
        currentlyDownloading
    })
})
app.get('/concat', async (req, res) => {
    if (isConcat)
        res.send({ concating: true, concatStarted: false, currentStatus })
    concatStateManager()
    res.send({
        concating: true,
        concatStarted: true,
        currentStatus
    })
})
app.get('/clean', async (req, res) => {
    let c = exec('rm -rf *.ts *.mp4', (err, stdout, stderr) => console.log(stderr))
    c.on('exit', code => {
        if (code !== 0) return res.send({ success: false, msg: 'couldnt clean' })
    })
    res.send({ success: true, msg: 'cleaned' })
})
app.get('/vod', (req, res) => {
    fs.exists('./VOD.mp4', (exists) => {
        if (exists) return res.sendFile(__dirname + '/VOD.mp4')
        else return res.send({success: false, msg: 'no file'})
    })
})
app.get('/vodexists', (req, res) => {
    fs.exists('./VOD.mp4', (exists) => {
        if (exists) return res.send({success: true, msg: 'File Exists'})
        else return res.send({success: false, msg: 'no file'})
    })
})

app.listen(parseInt(process.argv.slice(2)), () => console.log(`Listening on port ${process.argv.slice(2)}`))