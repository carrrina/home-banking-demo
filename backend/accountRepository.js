const sqlite3 = require('sqlite3').verbose();
const Account = require("./Account");

let db = new sqlite3.Database('./database/keep.db', (err) => {
  if (err) {
    return console.error('Could not open database.');
  }
});

db.run(`CREATE TABLE IF NOT EXISTS accounts(id INTEGER PRIMARY KEY,
                                            userId INTEGER,
                                            currency TEXT,
                                            type TEXT,
                                            amount REAL,
                                            iban TEXT)`);

module.exports = class AccountRepository{

    static addAccount(userId, account) {
        db.run(`INSERT INTO accounts(userId, currency, type, amount, iban)
                VALUES (?, ?, ?, ?, ?)`, 
                [userId, account.currency, account.type, account.amount, account.iban],
                function(err) {
                    if (err) throw err;
                });
    }

    static findAccount(iban){
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM accounts
                WHERE iban=?`, [iban], (err, row) => {
                    if (err) reject(err);
                    if (row) resolve(new Account(row.currency, row.type, row.amount, row.iban));
                    resolve(undefined);
            });
        });
    }

    static save(account){
        if (!account)
            return;
        db.run(`UPDATE accounts
            SET amount=?
            WHERE iban=?`,
            [account.amount, account.iban], function(err) {
                if (err) throw err;
            });
    }

    static removeAccount(account){
        if(account.amount != 0){
            throw new Error('The account is not empty and cannot be deleted');
        }

        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM accounts WHERE iban=?`, account.iban, function(err) {
                if (err) reject(err);
                resolve();
            });
        });
    }
}
