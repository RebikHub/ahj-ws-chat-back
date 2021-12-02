const http = require('http');
const Koa = require('koa');
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

app.use(async (ctx, next) => {
    const origin = ctx.request.get('Origin');
    if (!origin) {
        return await next();
    }
    const headers = {'Access-Control-Allow-Origin':'*',};
    if (ctx.request.method!=='OPTIONS') {
        ctx.response.set({...headers});
        try {
            return await next();
        } catch (e) {
            e.headers = {...e.headers, ...headers};
            throw e;
        }
    }
    if (ctx.request.get('Access-Control-Request-Method')) {
        ctx.response.set({...headers,'Access-Control-Allow-Methods':'GET, POST, PUT, DELETE, PATCH',});
        if (ctx.request.get('Access-Control-Request-Headers')) {
            ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Allow-Request-Headers'));
        }
        ctx.response.status = 204;
    }
});

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
    console.log(users);
    ctx.response.status=204;
});

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 3333;
const server = http.createServer(app.callback())

const wsServer = new WS.Server({ server });

wsServer.on('connection', (ws, req) => {
  ws.on('message', msg => {
    //   console.log(msg);
      const data = msg.toString('utf-8');
    console.log(data);
    [...wsServer.clients]
    .filter(o => o.readyState === WS.OPEN)
    .forEach(o => o.send(data));
  });

  ws.on('close', ev => {
    //   console.log(ev);
  })
//   ws.send('welcome');
});

server.listen(port, () => console.log('Server started'));