/**
 * @typedef {Object} Category
 * @property {number}        id
 * @property {string}        name
 * @property {string}        slug
 * @property {number|null}   parent_id
 * @property {number}        sort_order
 * @property {boolean}       is_active
 * @property {number}        [products_count]
 * @property {Category|null} [parent]
 * @property {Category[]}    [children]
 */

/**
 * @typedef {Object} CreateCategoryData
 * @property {string}       name
 * @property {string}       [slug]
 * @property {number|null}  [parent_id]
 * @property {number}       [sort_order]
 * @property {boolean}      [is_active]
 */

/**
 * @typedef {Partial<CreateCategoryData>} UpdateCategoryData
 */

/**
 * @typedef {Object} CategoryQueryParams
 * @property {string}  [search]
 * @property {boolean} [all]
 * @property {boolean} [roots_only]
 * @property {number}  [per_page]
 * @property {number}  [page]
 */
