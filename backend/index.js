const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const accountRepository = require('./accountRepository');
const userRepository = require('./userRepository');
const transactionRepository = require('./transactionRepository');
const User = require('./User');
const Converter = require('./Converter');
const Account = require('./Account');
const Transaction = require('./Transaction');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'asd jsshdlignsdogin;gozdnsgiseau4htvefnv4 ht werm';
const app = express();
app.use(cors());
app.options('*', cors());
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function login(request, response){
    const token = request.headers.authorization.replace('Bearer ', '');
    try {
        var tokenData = jwt.verify(token, SECRET_KEY);
    } catch (exception) {
        response.status(401);
        response.end(`You don't have access to this page`);
        return;
    }
    return userRepository.getById(tokenData.id);
}

app.get('/', (request, response) => {
    response.send('Welcome to Carina\'s Banking App!')
});
app.post('/login', (request, response) => {
    const username = request.body.username;
    const password = request.body.password; 
    userRepository.getByUsername(username).then((foundUser) => {
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
        
        const token = jwt.sign({ id: foundUser.id }, SECRET_KEY);
        response.send({ token: token });
    });
});

app.post('/accounts', function(request, response) {
    login(request, response).then((user) => {
         if(!user){
            response.status(401);
            response.end(`You don't have access to this page`);
            return;
        }   
        const account = new Account(request.body.currency, request.body.type);
        accountRepository.addAccount(user.id, account);
        response.end('Account added');
    });
});

app.get('/accounts', function(request, response){
    login(request, response).then((user) => {
        if(!user){
            response.status(401);
            response.end(`You don't have access to this page`);
            return;
        }
        userRepository.getAccountsOf(user).then((userAccounts) => {
            response.send(userAccounts);
        });
    });
});

app.delete('/account/:iban', function(request, response){
    login(request, response).then((user) => {
        if(!user){
            response.status(401);
            response.end(`You don't have access to this page`);
            return;
        }

        const iban = request.params.iban;
        accountRepository.findAccount(iban).then((account) => {
            if(!account){
                response.status(404);
                response.end(`Account not found`);
                return;
            }

            accountRepository.removeAccount(account).then(() => {
                response.end('Account deleted');
            });
        });
    });
})

app.post('/transactions', function(request, response){
    login(request, response).then((user) => {
        if(!user){
            response.status(401);
            response.end(`You don't have access to this page`);
            return;
        }
        accountRepository.findAccount(request.body.destination).then((destinationAccount) => {
            accountRepository.findAccount(request.body.source).then((sourceAccount) => {
                const transaction = new Transaction(
                    user.id,
                    new Date(),
                    request.body.source,
                    request.body.amount,
                    request.body.currency,
                    request.body.destination,
                    request.body.details,
                    request.body.type
                );

                const error = transaction.validate();
                if(error){
                    response.status(400);
                    response.end(error);
                    return;
                }

                try{
                    if(transaction.type === 'transaction'){
                        const sourceAmount = Converter.convert(transaction.amount,transaction.currency, sourceAccount.currency);
                        const destinationAmount = Converter.convert(transaction.amount, transaction.currency, destinationAccount.currency);
                        sourceAccount.subtract(sourceAmount);
                        destinationAccount.add(destinationAmount);
                    }
                    else if(transaction.type === 'cashin'){
                        const destinationAmount = Converter.convert(transaction.amount, transaction.currency, destinationAccount.currency);
                        destinationAccount.add(destinationAmount);
                    }
                    else if(transaction.type === 'cashout'){
                        const sourceAmount = Converter.convert(transaction.amount, sourceAccount.currency, transaction.currency);
                        sourceAccount.subtract(sourceAmount);
                    }
                    transaction.status = 'success';
                    accountRepository.save(destinationAccount);
                    accountRepository.save(sourceAccount);
                }catch(error){
                    transaction.status = 'failed';
                    response.end(`Transaction failed: ${error.message}`);
                };

                transactionRepository.add(transaction);
                response.end(`SUCCESS`);
            });
        });
    });
});

app.get('/transactions', function(request, response){
    const iban = request.query.iban;
    const startDate = request.query.startDate;
    const endDate = request.query.endDate;
    transactionRepository.find(iban, startDate, endDate).then((transactions) => {
        response.send(transactions);
    })
});

app.get('/total/:currency', function(request,response){
    login(request, response).then((user) => {
        if(!user){
            response.status(401);
            response.end(`You don't have access to this page`);
            return;
        }

        const currency = request.params.currency;

        userRepository.getAccountsOf(user).then((accounts) => {
            const total = accounts.reduce((total, account) => {
                return total + Converter.convert(account.amount, account.currency, currency);
            }, 0)

            response.send("Your total is: " + total + " " + currency);
        });
    });
});

app.listen(port, () => console.log(`App is listening on port ${port}!`));
