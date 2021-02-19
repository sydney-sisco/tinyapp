const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
};

const generateRandomString = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomChars = [];

  for (let i = 0; i < 6; i++) {
    randomChars.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  return randomChars.join('');
};

const getURLsByUser = (userID, urlDatabase) => {
  const userURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === userID) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
};

const countUniqueVisitors = (visits) => {
  let uniqueVisitorCount = 0;
  const visitors = [];

  for (const visit of visits) {
    if (!visitors.includes(visit.visitorID)) {
      visitors.push(visit.visitorID);
      uniqueVisitorCount++;
    }
  }

  return uniqueVisitorCount;
};

module.exports = { getUserByEmail, generateRandomString, getURLsByUser, countUniqueVisitors };
