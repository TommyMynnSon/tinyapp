const { assert } = require('chai');

const { generateRandomString, isNewEmail, getUserByEmail, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testUrls = {
  "111111": {
    "longURL": "http://www.user2-A.com",
    "userId": "user2RandomID"
  },
  "222222": {
    "longURL": "http://www.user1-A.com",
    "userId": "userRandomID"
  },
  "333333": {
    "longURL": "http://www.user1-B.com",
    "userId": "userRandomID"
  },
  "444444": {
    "longURL": "http://www.user2-B.com",
    "userId": "user2RandomID"
  }
};

const testUrlsEmpty = {

};

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";

    assert.strictEqual(user.id, expectedOutput);
  });

  it('should return undefined with invalid email', () => {
    const user = getUserByEmail("does_not_exist@example.com", testUsers);

    assert.isUndefined(user);
  });
});

describe('isNewEmail', () => {
  it('should return true with unused email', () => {
    assert.isTrue(isNewEmail('never-used@gmailcom', testUsers));
  });

  it('should return false with used email', () => {
    assert.isFalse(isNewEmail('user2@example.com', testUsers));
  });
});

describe('urlsForUser', () => {
  it('should return correct urls provided a valid userID and populated urls database', () => {
    const actual = urlsForUser('user2RandomID', testUrls);
    const expected = {
      "111111": "http://www.user2-A.com",
      "444444": "http://www.user2-B.com",
    };

    assert.deepEqual(actual, expected);
  });

  it('should return empty object provided a valid userID and unpopulated urls database', () => {
    const actual = urlsForUser('user2RandomID', testUrlsEmpty);

    assert.isEmpty(actual);
  });
});

describe('generateRandomString', () => {
  it('should return string of length 6', () => {
    assert.strictEqual(generateRandomString().length, 6);
  });
});