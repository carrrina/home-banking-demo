const coversionTable = {
  EUR: {
    EUR: 1,
    RON: 4.65,
    USD: 1.2
  },
  RON: {
    RON: 1,
    EUR: 1 / 4.79,
    USD: 1 / 4.3
  },
  USD: {
    RON: 4.25,
    EUR: 1 / 1.2,
    USD: 1
  }
};

module.exports = class Converter {
  static convert(amount, from, to) {
    return amount * coversionTable[from][to];
  }
};
