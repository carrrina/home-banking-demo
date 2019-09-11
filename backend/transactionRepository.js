const sqlite3 = require('sqlite3').verbose();
const Transaction = require('./Transaction');

let db = new sqlite3.Database('./database/keep.db', (err) => {
  if (err) {
    return console.error('Could not open database.');
  }
});

db.run(`CREATE TABLE IF NOT EXISTS transactions(id INTEGER PRIMARY KEY, 
                                        userId INTEGER,
                                        date TEXT,
                                        sourceAccount TEXT,
                                        amount REAL,
                                        currency TEXT,
                                        destinationAccount TEXT,
                                        details TEXT,
                                        type TEXT)`);

module.exports = class{
    static add(transaction){
        var sourceAccount, destinationAccount;
        if (transaction.sourceAccount === undefined)
            sourceAccount = '';
        else
            sourceAccount = transaction.sourceAccount;
        if (transaction.destinationAccount === undefined)
            destinationAccount = '';
        else
            destinationAccount = transaction.destinationAccount;
        var date = transaction.date.toString();
        db.run(`INSERT INTO transactions(userId, date, sourceAccount, amount, currency, destinationAccount, details, type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                [transaction.userId, date, sourceAccount, transaction.amount, transaction.currency, destinationAccount, transaction.details, transaction.type],
                function(err) {
                    if (err) return console.log(err.message);
                });
    }

    static getAll(){
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM transactions
                    ORDER BY date DESC`, [], (err, transactions) => {
                if (err) reject(err);
                if (transactions) resolve(transactions);
            });
        });
    }

    static find(iban, startDate, endDate){
        return new Promise((resolve, reject) => {
        this.getAll().then((transactions) => {
            var newTransactions = transactions;
            if (iban) {
                newTransactions = newTransactions
                .filter(transaction => {
                    return (transaction.destinationAccount && 
                    transaction.destinationAccount === iban) 
                    || (transaction.sourceAccount && 
                    transaction.sourceAccount === iban)
                });
            }
            if(startDate){
                newTransactions = newTransactions.filter(transaction => {
                    return transaction.date >= new Date(startDate);
                });
            }
            if(endDate){
                newTransactions = newTransactions.filter(transaction => {
                    return transaction.date <= new Date(endDate);
                });
            }
            resolve(newTransactions);
        }); 
        });
    }
}
