const express = require('express');
const bodyParser = require("body-parser");
const database = require("./database");
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'asd jsshdlignsdogin;gozdnsgiseau4htvefnv4 ht werm';
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const users = database.users;

app.get('/', (request, response) => response.send('Hello World!'));
app.post('/login', (request, response) => {
    const username = request.body.username;
    const password = request.body.password;
    const foundUser = users.find(user => user.username === username);

    if (foundUser === undefined) {
        response.status(404);
        response.send('User not found');
        return;
    }

    if (foundUser.password !== password) {
        response.status(400);
        response.send('Wrong password');
        return;
    }

    const token = jwt.sign({id: foundUser.id}, SECRET_KEY);

    response.send({token: token});
});

app.post('/account', function (request, response) {
    const token = request.headers.authorization.replace('Bearer ', '');
    try {
        var tokenData = jwt.verify(token, SECRET_KEY);
    } catch (exception) {
        response.status(401);
        response.send(`You don't have access to this page`);
    }
    const user = users.find(user => user.id === tokenData.id);

    const account = request.body;
    account.amount = 0;
    account.iban = parseInt(Math.random() * 100000000000);
    user.accounts.push(account);
    response.send(user);
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`));