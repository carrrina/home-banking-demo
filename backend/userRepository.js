const sqlite3 = require('sqlite3').verbose();
const User = require("./User");
const Account = require("./Account");

let db = new sqlite3.Database('./database/keep.db', (err) => {
  if (err) {
    return console.error('Could not open database.');
  }
});

db.run(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, 
                                        username TEXT,
                                        password TEXT)`);

module.exports = class UserRepository{

    static getAccountsOf(user){
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM accounts
                WHERE userId = ?`, [user.id], (err, userAccounts) => {
                    if (err) reject(err);
                    if (userAccounts) resolve(userAccounts);
            });
        });
    }

    static getById(id){
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM users
                WHERE id=?`, [id], (err, row) => {
                    if (err) reject(err);
                    if (row) resolve(new User(row.id, row.username, row.password));
                    resolve(undefined);
            });
        });
    }

    static getByUsername(username){
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM users
                WHERE username=?`, [username], (err, row) => {
                    if (err) reject(err);
                    if (row) 
                        resolve(new User(row.id, row.username, row.password));
            });
        });
    }
}
