/**
 * @typedef {Object} User
 * @property {number}   id
 * @property {string}   name
 * @property {string}   email
 * @property {string}   [phone]
 * @property {string[]} roles
 * @property {string[]} permissions
 */

/**
 * @typedef {Object} ProfileData
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 */

/**
 * @typedef {Object} ChangePasswordData
 * @property {string} current_password
 * @property {string} password
 * @property {string} password_confirmation
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} token
 * @property {User}   user
 */
