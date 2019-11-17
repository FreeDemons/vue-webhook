let http = require('http')
let crypto = require('crypto')
let spawn = require('child_process')
const SECRET = '123456'
const sign = function (body) {
    // github 的加密算法
    return `sha1=${crypto.createHmac('sha1',SECRET).update(body).digest('hex')}`
}

let server = http.createServer(function (req, res) {
    console.log(req.method, req.url);
    if (req.method === 'POST' && req.url === '/webhook') {
        let buffers = []
        req.on('data', function (buffer) {
            buffers.push(buffer)
        });
        req.on('end', function (buffer) {
            let body = Buffer.concat(buffer)
            const event = req.headers['x-github-event']; // 表示git的什么事件
            const signature = req.headers['x-github-signature'];
            if (signature !== sign(body)) {
                res.end('Not Allowed');
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
                ok: true
            }));
            // 此处开始部署
            if (event === 'push') {
                // 拿到完整的返回体
                let payload = JSON.parse(body);
                // 使用子进程来执行这个命令：sh ./xxx.sh
                let child = spawn('sh', [`./${body.repository.name}.sh`]);
                let buffers = []
                // 打印日志
                child.stdout.on('data', function(buffer){
                    buffers.push(buffer)
                });
                child.stdout.on('end', function(buffer){
                    let log = Buffer.concat(buffers)
                    console.log(log);
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