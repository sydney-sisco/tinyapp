const { assert } = require('chai');

const { getUserByEmail, generateRandomString } = require('../helpers.js');

const testUsers = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail('user@example.com', testUsers);
    const expectedOutput = 'userRandomID';
    
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
