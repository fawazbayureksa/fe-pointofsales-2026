/**
 * @typedef {Object} User
 * @property {number}   id
 * @property {string}   name
 * @property {string}   email
 * @property {string}   [phone]
 * @property {string[]} roles
 * @property {string[]} [permissions]
 * @property {boolean}  [has_pin]
 */

/**
 * @typedef {Object} Tenant
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {string} email
 * @property {string} plan
 * @property {string} status
 * @property {string} subscription_status
 * @property {string} trial_ends_at
 */

/**
 * @typedef {Object} Outlet
 * @property {number} id
 * @property {string} name
 * @property {string} code
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} RegisterData
 * @property {string} name
 * @property {string} [business_name]
 * @property {string} email
 * @property {string} password
 * @property {string} password_confirmation
 * @property {string} [phone]
 */

/**
 * @typedef {Object} RegisterResponse
 * @property {string} message
 * @property {string} token
 * @property {User}   user
 * @property {Tenant} tenant
 * @property {Outlet} outlet
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
