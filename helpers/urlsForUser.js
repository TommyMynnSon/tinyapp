/**
 * Get URLs created by user with id
 * @param {string} id 
 * @returns {object}
 */
const urlsForUser = (id, database) => {
  let urls = {};

  for (const shortURL in database) {
    if (database[shortURL]["userId"] === id) {
      urls[shortURL] = database[shortURL].longURL;
    }
  }

  return urls;
};

module.exports = { urlsForUser };