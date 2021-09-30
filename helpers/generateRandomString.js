/**
 * Generate an alphanumeric string of length 6
 * @returns {string}
 */
const generateRandomString = () => {
  // (Type 1) HTML code value bounds for uppercase letters
  const upperCaseStart = 65;
  const upperCaseEnd = 90;

  // (Type 2) HTML code value bounds for lowercase letters
  const lowerCaseStart = 97;
  const lowerCaseEnd = 122;

  // (Type 3) HTML code value bounds for the numbers 0 - 9
  const numberStart = 48;
  const numberEnd = 57;

  let randomString = '';

  for (let i = 0; i < 6; i++) {
    // Pick random Type
    const min = 1;
    const max = 3;

    const type = Math.floor(Math.random() * (max - min + 1)) + min;

    // Random HTML code
    let htmlCode;

    // Pick random uppercase letter HTML code
    if (type === 1) {
      htmlCode = Math.floor(Math.random() * (upperCaseEnd - upperCaseStart + 1)) + upperCaseStart;
    }

    // Pick random lowercase letter HTML code
    if (type === 2) {
      htmlCode = Math.floor(Math.random() * (lowerCaseEnd - lowerCaseStart + 1)) + lowerCaseStart;
    }

    // Pick random number HTML code
    if (type === 3) {
      htmlCode = Math.floor(Math.random() * (numberEnd - numberStart + 1)) + numberStart;
    }

    randomString += String.fromCharCode(htmlCode);
  }

  return randomString;
};

module.exports = { generateRandomString };