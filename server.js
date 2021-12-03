const http = require('http');
// const https = require('https');
const Koa = require('koa');
const cors = require('koa2-cors');
const koaBody = require('koa-body');
const Router = require('koa-router');
const router = new Router();
const app = new Koa();
const { v4: uuidv4 } = require('uuid');

const WS = require('ws');

const users = [];

app.use(koaBody({
    urlencoded: true,
    multipart: true,
    json:true,
}));

app.use(
    cors({
      origin: '*',
      credentials: true,
      'Access-Control-Allow-Origin': true,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    })
  )

router.get('/users', async (ctx, next) => {
    ctx.response.body = users;
});

router.post('/users', async (ctx, next) => {
    try {
        users.forEach((elem) => {
            if (elem.nickname === ctx.request.body) {
                throw new Error('такой никнейм уже есть!');
            }
        })
        users.push({nickname: ctx.request.body, id: uuidv4()});
        ctx.response.status = 204;
    } catch (error) {
        ctx.response.body = 'ошибка';
    }
});

router.delete('/users/:id', async (ctx, next) => {
    const index = users.findIndex((elem) => elem.id === ctx.params.id);
    if (index !== -1) {
        users.splice(index, 1);
    };
    ctx.response.status=204;
});

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 3333;
const server = http.createServer(app.callback())

const wsServer = new WS.Server({ server });

wsServer.on('connection', (ws, req) => {
  ws.on('message', msg => {
    const data = msg.toString('utf-8');
    [...wsServer.clients]
    .filter(o => o.readyState === WS.OPEN)
    .forEach(o => o.send(data));
  });
});

server.listen(port, () => console.log('Server started'));