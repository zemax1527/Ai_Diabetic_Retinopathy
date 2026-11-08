/**
 * Test Suite: NOTIF-03 Phase 1 — Indian Phone Normalization Utility
 *
 * Verifies:
 * 1. normalizeIndianPhone(rawPhone)
 *    - 10-digit mobile numbers
 *    - Leading 0 prefix
 *    - +91 international prefix
 *    - 91 country code prefix
 *    - Formatting characters (spaces, hyphens, parentheses, dots)
 *    - Valid first digit (6, 7, 8, 9)
 *    - Invalid first digit (0, 1, 2, 3, 4, 5)
 *    - Invalid lengths (too short, too long)
 *    - Invalid prefixes (+1, +44, +98, misplaced '+')
 *    - Non-string inputs (null, undefined, numbers, objects, booleans)
 *    - Injection & illegal characters
 * 2. isValidIndianPhone(rawPhone)
 *    - Strict boolean return for valid and invalid cases
 * 3. Security & PII Protection
 *    - Zero console logging during normalization
 */

const { normalizeIndianPhone, isValidIndianPhone } = require('../utils/phone.util');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(title, condition, extraInfo = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`PASS [Test ${totalTests}]: ${title} ${extraInfo ? `(${extraInfo})` : ''}`);
  } else {
    failedTests++;
    console.error(`FAIL [Test ${totalTests}]: ${title} ${extraInfo ? `(${extraInfo})` : ''}`);
  }
}

console.log('=== NOTIF-03 Phase 1: Indian Phone Normalization Test Suite ===\n');

// -----------------------------------------------------------------
// 1. VALID 10-DIGIT MOBILE NUMBERS
// -----------------------------------------------------------------
console.log('--- 1. Valid 10-digit Mobile Numbers ---');
assert('10-digit starting with 9', normalizeIndianPhone('9876543210') === '919876543210');
assert('10-digit starting with 8', normalizeIndianPhone('8123456789') === '918123456789');
assert('10-digit starting with 7', normalizeIndianPhone('7000000000') === '917000000000');
assert('10-digit starting with 6', normalizeIndianPhone('6999999999') === '916999999999');

// -----------------------------------------------------------------
// 2. LEADING ZERO (TRUNK PREFIX)
// -----------------------------------------------------------------
console.log('\n--- 2. Leading Zero (Trunk Prefix) ---');
assert('11-digit with leading 0 (starts with 9)', normalizeIndianPhone('09876543210') === '919876543210');
assert('11-digit with leading 0 (starts with 8)', normalizeIndianPhone('08123456789') === '918123456789');
assert('11-digit with leading 0 (starts with 7)', normalizeIndianPhone('07000000000') === '917000000000');
assert('11-digit with leading 0 (starts with 6)', normalizeIndianPhone('06999999999') === '916999999999');

// -----------------------------------------------------------------
// 3. +91 INTERNATIONAL PREFIX
// -----------------------------------------------------------------
console.log('\n--- 3. +91 International Prefix ---');
assert('+91 prefix compact', normalizeIndianPhone('+919876543210') === '919876543210');
assert('+91 prefix with space', normalizeIndianPhone('+91 9876543210') === '919876543210');
assert('+91 prefix with hyphen', normalizeIndianPhone('+91-9876543210') === '919876543210');
assert('+91 with parens (+91)', normalizeIndianPhone('(+91) 9876543210') === '919876543210');

// -----------------------------------------------------------------
// 4. 91 COUNTRY CODE PREFIX (WITHOUT PLUS)
// -----------------------------------------------------------------
console.log('\n--- 4. 91 Country Code Prefix (Without Plus) ---');
assert('91 prefix compact', normalizeIndianPhone('919876543210') === '919876543210');
assert('91 prefix with space', normalizeIndianPhone('91 9876543210') === '919876543210');
assert('91 prefix with hyphen', normalizeIndianPhone('91-9876543210') === '919876543210');

// -----------------------------------------------------------------
// 5. FORMATTING CHARACTERS (SPACES, HYPHENS, PARENTHESES, DOTS)
// -----------------------------------------------------------------
console.log('\n--- 5. Formatting Characters & Punctuation ---');
assert('Spaces between digits: 98765 43210', normalizeIndianPhone('98765 43210') === '919876543210');
assert('Hyphens between digits: 98765-43210', normalizeIndianPhone('98765-43210') === '919876543210');
assert('Multi-hyphen: 98-765-43210', normalizeIndianPhone('98-765-43210') === '919876543210');
assert('Parentheses: (98765) 43210', normalizeIndianPhone('(98765) 43210') === '919876543210');
assert('Dots between digits: 98765.43210', normalizeIndianPhone('98765.43210') === '919876543210');
assert('Leading 0 with formatting: 0-98765-43210', normalizeIndianPhone('0-98765-43210') === '919876543210');
assert('+91 with full formatting: +91 (987) 654-3210', normalizeIndianPhone('+91 (987) 654-3210') === '919876543210');
assert('Leading and trailing whitespace: "  9876543210  "', normalizeIndianPhone('  9876543210  ') === '919876543210');
assert('+91 with leading/trailing whitespace: "  +91 98765 43210  "', normalizeIndianPhone('  +91 98765 43210  ') === '919876543210');

// -----------------------------------------------------------------
// 6. INVALID FIRST DIGIT (MOBILE MUST START WITH 6, 7, 8, OR 9)
// -----------------------------------------------------------------
console.log('\n--- 6. Invalid First Digit (Must start with 6, 7, 8, 9) ---');
assert('Rejects 10-digit starting with 5', normalizeIndianPhone('5876543210') === null);
assert('Rejects 10-digit starting with 4', normalizeIndianPhone('4876543210') === null);
assert('Rejects 10-digit starting with 3', normalizeIndianPhone('3876543210') === null);
assert('Rejects 10-digit starting with 2', normalizeIndianPhone('2876543210') === null);
assert('Rejects 10-digit starting with 1', normalizeIndianPhone('1876543210') === null);
assert('Rejects 10-digit starting with 0', normalizeIndianPhone('0876543210') === null);
assert('Rejects +91 with invalid first digit: +91 5876543210', normalizeIndianPhone('+91 5876543210') === null);
assert('Rejects 0 prefix with invalid first digit: 05876543210', normalizeIndianPhone('05876543210') === null);
assert('Rejects 91 prefix with invalid first digit: 915876543210', normalizeIndianPhone('915876543210') === null);

// -----------------------------------------------------------------
// 7. INVALID LENGTH (TOO SHORT / TOO LONG)
// -----------------------------------------------------------------
console.log('\n--- 7. Invalid Length ---');
assert('Rejects empty string ""', normalizeIndianPhone('') === null);
assert('Rejects whitespace only "   "', normalizeIndianPhone('   ') === null);
assert('Rejects 1 digit "9"', normalizeIndianPhone('9') === null);
assert('Rejects 5 digits "98765"', normalizeIndianPhone('98765') === null);
assert('Rejects 9 digits "987654321"', normalizeIndianPhone('987654321') === null);
assert('Rejects +91 with only 9 digits: +91 987654321', normalizeIndianPhone('+91 987654321') === null);
assert('Rejects 13 digits: 9198765432100', normalizeIndianPhone('9198765432100') === null);
assert('Rejects +91 with 11 digits: +91 98765432101', normalizeIndianPhone('+91 98765432101') === null);
assert('Rejects 14 digits', normalizeIndianPhone('91987654321012') === null);

// -----------------------------------------------------------------
// 8. INVALID PREFIXES & COUNTRY CODES
// -----------------------------------------------------------------
console.log('\n--- 8. Invalid Prefixes & Country Codes ---');
assert('Rejects US prefix +1: +1 9876543210', normalizeIndianPhone('+1 9876543210') === null);
assert('Rejects UK prefix +44: +44 9876543210', normalizeIndianPhone('+44 9876543210') === null);
assert('Rejects Iran prefix +98: +98 7654321012', normalizeIndianPhone('+98 7654321012') === null);
assert('Rejects + followed by mobile without 91: +9876543210', normalizeIndianPhone('+9876543210') === null);
assert('Rejects 11 digits not starting with 0: 19876543210', normalizeIndianPhone('19876543210') === null);
assert('Rejects 11 digits not starting with 0: 89876543210', normalizeIndianPhone('89876543210') === null);
assert('Rejects 12 digits not starting with 91: 929876543210', normalizeIndianPhone('929876543210') === null);
assert('Rejects 12 digits starting with 00: 009876543210', normalizeIndianPhone('009876543210') === null);
assert('Rejects misplaced + in middle: 987+6543210', normalizeIndianPhone('987+6543210') === null);
assert('Rejects multiple + signs: ++919876543210', normalizeIndianPhone('++919876543210') === null);
assert('Rejects multiple + signs: +91+9876543210', normalizeIndianPhone('+91+9876543210') === null);
assert('Rejects + prefix alone: "+"', normalizeIndianPhone('+') === null);
assert('Rejects +91 alone without number: "+91"', normalizeIndianPhone('+91') === null);

// -----------------------------------------------------------------
// 9. NON-STRING INPUTS & TYPE SECURITY
// -----------------------------------------------------------------
console.log('\n--- 9. Non-String Inputs & Type Security ---');
assert('Rejects null', normalizeIndianPhone(null) === null);
assert('Rejects undefined', normalizeIndianPhone(undefined) === null);
assert('Rejects number type: 9876543210', normalizeIndianPhone(9876543210) === null);
assert('Rejects boolean true', normalizeIndianPhone(true) === null);
assert('Rejects boolean false', normalizeIndianPhone(false) === null);
assert('Rejects object {}', normalizeIndianPhone({}) === null);
assert('Rejects array []', normalizeIndianPhone([]) === null);
assert('Rejects array of digits', normalizeIndianPhone(['9876543210']) === null);
assert('Rejects function', normalizeIndianPhone(() => '9876543210') === null);
assert('Rejects NaN', normalizeIndianPhone(NaN) === null);

// -----------------------------------------------------------------
// 10. ILLEGAL CHARACTERS & INJECTION ATTEMPTS
// -----------------------------------------------------------------
console.log('\n--- 10. Illegal Characters & Injection Protection ---');
assert('Rejects letters appended: 9876543210a', normalizeIndianPhone('9876543210a') === null);
assert('Rejects letters prefixed: call 9876543210', normalizeIndianPhone('call 9876543210') === null);
assert('Rejects email format: 9876543210@test.com', normalizeIndianPhone('9876543210@test.com') === null);
assert('Rejects special symbol #: 98765#43210', normalizeIndianPhone('98765#43210') === null);
assert('Rejects special symbol $: 98765$43210', normalizeIndianPhone('98765$43210') === null);
assert('Rejects HTML tag: <script>', normalizeIndianPhone('<script>') === null);
assert('Rejects SQL injection: 9876543210; DROP TABLE', normalizeIndianPhone('9876543210; DROP TABLE') === null);

// -----------------------------------------------------------------
// 11. isValidIndianPhone BOOLEAN INTEGRITY
// -----------------------------------------------------------------
console.log('\n--- 11. isValidIndianPhone Boolean Integrity ---');
assert('isValidIndianPhone: returns true for 10-digit mobile', isValidIndianPhone('9876543210') === true);
assert('isValidIndianPhone: returns true for +91 mobile', isValidIndianPhone('+91 98765 43210') === true);
assert('isValidIndianPhone: returns true for leading 0 mobile', isValidIndianPhone('09876543210') === true);
assert('isValidIndianPhone: returns true for 91 prefix', isValidIndianPhone('919876543210') === true);
assert('isValidIndianPhone: returns false for invalid first digit', isValidIndianPhone('5876543210') === false);
assert('isValidIndianPhone: returns false for too short', isValidIndianPhone('98765') === false);
assert('isValidIndianPhone: returns false for too long', isValidIndianPhone('9198765432100') === false);
assert('isValidIndianPhone: returns false for null', isValidIndianPhone(null) === false);
assert('isValidIndianPhone: returns false for undefined', isValidIndianPhone(undefined) === false);
assert('isValidIndianPhone: returns false for number', isValidIndianPhone(9876543210) === false);
assert('isValidIndianPhone: returns false for non-Indian prefix', isValidIndianPhone('+19876543210') === false);
assert('isValidIndianPhone: strictly returns boolean type (true)', typeof isValidIndianPhone('9876543210') === 'boolean');
assert('isValidIndianPhone: strictly returns boolean type (false)', typeof isValidIndianPhone('invalid') === 'boolean');

// -----------------------------------------------------------------
// 12. PII SECURITY: NO CONSOLE LOGGING
// -----------------------------------------------------------------
console.log('\n--- 12. Security: Zero Phone Logging Verification ---');
let loggedOutput = [];
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => loggedOutput.push(args.join(' '));
console.error = (...args) => loggedOutput.push(args.join(' '));
console.warn = (...args) => loggedOutput.push(args.join(' '));

normalizeIndianPhone('+91 98765 43210');
normalizeIndianPhone('invalid phone');
isValidIndianPhone('09876543210');
isValidIndianPhone(null);

console.log = originalLog;
console.error = originalError;
console.warn = originalWarn;

assert('No console logs emitted during phone normalization or validation', loggedOutput.length === 0);

// -----------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------
console.log(`\n======================================================`);
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log(`======================================================`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
