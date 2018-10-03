const sys = require('sys')
const exec = require('child_process').exec
const fs = require('fs')
const path = require('path')
const intermediateArr = []
let counter = 1
const intermediateFileName = fileName => `${counter++}.ts`
// const intermediateFileName = fileName => `intermediate_${fileName}.ts`.replace(/[^a-zA-Z1-9_.]+/g, 'r')
// const cmdInputToInter = fileName => {
//     iFileName = intermediateFileName(fileName)
//     intermediateArr.push(iFileName)
//     return `ffmpeg -i ${fileName} -c copy -bsf:v h264_mp4toannexb -f mpegts ${iFileName}`
// }
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

const concat = async () => {
    const files = fs.readdirSync('.').filter(file => file.split('.').pop() === 'mp4')
    try {
        await Promise.all(files.map(async (file) => {
            try {
                await mp4ToTs(file)
            }
            catch (e) {
                console.log(e)
            }
        }))
        console.log('Awating TS Completion')
        setTimeout(async () => {
            console.log('Merging')
            await merge('VOD.mp4')
        }, 2000)
    }
    catch (e) {
        console.log(e)
    }
}

concat()



// f = exec("ffmpeg -i rip.mp4 -c copy -bsf:v h264_mp4toannexb -f mpegts lulx.ts -nostats -loglevel 0")
// f.on('exit', code => {
//     console.log(code)
// })

// ffmpeg -i input1.mp4 -c copy -bsf:v h264_mp4toannexb -f mpegts intermediate1.ts
// ffmpeg -i input2.mp4 -c copy -bsf:v h264_mp4toannexb -f mpegts intermediate2.ts
// ffmpeg -i "concat:inter1.ts|inter2.ts|inter3.ts|inter4.ts|inter5.ts|inter6.ts|inter7.ts|inter8.ts|inter9.ts|inter10.ts|inter11.ts|inter12.ts|inter13.ts|inter14.ts|inter15.ts|inter16.ts|inter17.ts|inter18.ts|inter19.ts" -c copy -bsf:a aac_adtstoasc output.mp4

// ffmpeg -i "concat:0.ts|1.ts|2.ts|3.ts|4.ts|5.ts|6.ts|7.ts|8.ts|9.ts|10.ts|11.ts|12.ts|13.ts|14.ts|15.ts|16.ts|17.ts|18.ts" -c copy -bsf:a aac_adtstoasc VOD.mp4
