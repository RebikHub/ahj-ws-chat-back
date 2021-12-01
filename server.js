const data = require('./tickets');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();
const { v4: uuidv4 } = require('uuid');
const port = process.env.PORT || 3333;

app.use(koaBody({ urlencoded:true, }));

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
        ctx.response.status = 204;// No content
    }
});

app.use(async ctx => {
    const { method, id } = ctx.request.query;
    if (method === 'allTickets') {
        ctx.response.body = data.tickets;
        return;
    }

    if (method === 'ticketById') {
        data.fullTickets.forEach((item) => {
            if (item.id === id) {
                ctx.response.body = item.description;
            }
        })
        return;
    }

    if (method === 'statusId') {
        data.fullTickets.forEach((item) => {
            if (item.id === id) {
                if (item.status === true) {
                    item.status = false;
                } else {
                    item.status = true;
                }
            }
        })
        data.tickets.forEach((item) => {
            if (item.id === id) {
                if (item.status === true) {
                    item.status = false;
                } else {
                    item.status = true;
                }
            }
        })
        return;
    }

    if (method === 'deleteId') {
        let indexF = null;
        let index = null;
        data.fullTickets.forEach((item, i) => {
            if (item.id === id) {
                indexF = i;
            }
        })
        data.fullTickets.splice(indexF, 1);
        data.tickets.forEach((item, i) => {
            if (item.id === id) {
                index = i;
            }
        })
        data.tickets.splice(index, 1);
        return;
    }

    if (method === 'createTicket') {
        const ticket = JSON.parse(ctx.request.body);

        if (ticket.id) {
            data.tickets.forEach((item) => {
                if (item.id === ticket.id) {
                    item.name = ticket.name;
                    item.status = ticket.status;
                }
            })
            data.fullTickets.forEach((item) => {
                if (item.id === ticket.id) {
                    item.name = ticket.name;
                    item.description = ticket.description;
                    item.status = ticket.status;
                }
            })
            return;
        }
        ticket.id = uuidv4();
        data.fullTickets.push(ticket);
        data.tickets.push({
            id: ticket.id,
            name: ticket.name,
            status: ticket.status,
            created: ticket.created
        });
        ctx.response.status = 200;
        return;
    }

    ctx.response.status = 404;
    return;
});


app.listen(port, () => console.log('Server started'));