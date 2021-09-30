/**
 * Check if email has already been used to register
 * @param {string} email 
 * @param {object} database
 * @returns {boolean}
 */
const isNewEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return false;
    }
  }

  return true;
};

module.exports = { isNewEmail };