let http = require('http')
let crypto = require('crypto')
let {spawn} = require('child_process')
let sendMail = require('./sendMail.js')
const SECRET = '123456'
const sign = function (body) {
    // github 的加密算法
    return `sha1=${crypto.createHmac('sha1',SECRET).update(body).digest('hex')}`
}

let server = http.createServer(function (req, res) {
    console.log(req.method, req.url);
    if (req.method === 'POST' && req.url === '/webhook') {
        let buffers = [];
        req.on('data', function (buffer) {
            buffers.push(buffer);
        });
        req.on('end', function (buffer) {
            let body = Buffer.concat(buffers)
            const event = req.headers['x-github-event']; // 表示git的什么事件
            const signature = req.headers['x-github-signature'];
            if (signature !== sign(body)) {
                res.end('Not Allowed');
            }
            // res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                ok: true
            }));
            // 此处开始部署
            if (event === 'push') {
                // 拿到完整的返回体
                let payload = JSON.parse(body);
                // 使用子进程来执行这个命令：sh ./xxx.sh
                let child = spawn('sh', [`./${payload.repository.name}.sh`]);
                let buffers = [];
                // 打印日志
                child.stdout.on('data', function(buffer){
                    buffers.push(buffer);
                });
                child.stdout.on('end', function(buffer){
                    let logs = Buffer.concat(buffers).toString();
                    console.log(logs);
                    sendMail(`
                        <h1>部署日期: ${new Date()}</h1>
                        <h2>部署人: ${payload.pusher.name}</h2>
                        <h2>部署邮箱: ${payload.pusher.email}</h2>
                        <h2>提交信息: ${payload.head_commit&&payload.head_commit['message']}</h2>
                        <h2>布署日志: ${logs.replace("\r\n",'<br/>')}</h2>
                    `);
                })

            }
        });



    } else {
        res.end('Not Found');
    }

})

server.listen(4000, () => {
    console.log('webhook 服务已启动');

})