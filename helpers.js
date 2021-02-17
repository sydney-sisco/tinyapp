const getUserByEmail = function(email, database) {
  for (user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
};

module.exports = { getUserByEmail };
