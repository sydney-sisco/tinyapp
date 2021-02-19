const { assert } = require('chai');

const { getUserByEmail, generateRandomString, getURLsByUser } = require('../helpers.js');

const testUsers = {
  'EoPVvj': {
    id: 'EoPVvj',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  'tEP8X1': {
    id: 'tEP8X1',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

const testURLs = {
  "b6UTxQ":{
    "longURL":"http://www.lighthouselabs.ca",
    "userID":"EoPVvj"
  },
  "i3BoGr":{
    "longURL":"https://www.google.ca",
    "userID":"aJ48lW"
  }
};

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail('user@example.com', testUsers);
    const expectedOutput = 'EoPVvj';
    
    assert.equal(user.id, expectedOutput);
  });

  it('should return null when the user does not exist', () => {
    const user = getUserByEmail('doesnotexist@fake.com', testUsers);
    
    assert.isNull(user);
  });
});

describe('generateRandomString', () => {
  it('should return a random string', () => {
    const string1 = generateRandomString();
    const string2 = generateRandomString();

    assert.notEqual(string1, string2);
  });

  it('should return a string of length 6', () => {
    const string = generateRandomString();

    assert.equal(string.length, 6);
  });
});

describe('getURLsByUser', () => {
  it('should only return URLs owned by the given user', () => {
    const urls = getURLsByUser('EoPVvj', testURLs);
    const expectedOutput = {
      "b6UTxQ":{
        "longURL":"http://www.lighthouselabs.ca",
        "userID":"EoPVvj"
      }
    };

    assert.deepEqual(urls, expectedOutput);
  });

  it('should return an empty object if the user has no URLs', () => {
    const urls = getURLsByUser('tEP8X1', testURLs);

    assert.deepEqual(urls, {});
  });
});
