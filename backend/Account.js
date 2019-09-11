module.exports = class Account {
    constructor(currency, type, amount, iban) {
        this.currency = currency;
        this.type = type;
        this.amount = amount || 0;
        this.iban = iban || Account.generateIBAN();
    }

    static generateIBAN() {
        return "RO" + Math.round(Math.random() * 100) + "GMF" + Math.round(Math.random() * 100000000000) + "CC" + Math.round(Math.random() * 100000);
    }

    subtract(amount){
        if(this.type !== 'credit' && this.amount < amount ){
            throw new Error(`You don't have enough money`);
        }
        this.amount -= amount;
    }

    add(amount){
        this.amount += amount;
    }
};
