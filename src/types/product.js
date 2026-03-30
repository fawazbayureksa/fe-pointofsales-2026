/**
 * @typedef {Object} Product
 * @property {number}       id
 * @property {string}       name
 * @property {string|null}  sku
 * @property {string|null}  barcode
 * @property {string|null}  description
 * @property {number|null}  category_id
 * @property {string}       price          – decimal string from API, e.g. "25000.00"
 * @property {string|null}  cost_price
 * @property {string|null}  unit
 * @property {boolean}      is_active
 * @property {boolean}      track_stock
 * @property {string|null}  image
 * @property {number}       [stock]        – optional, present when outlet_id is provided
 */

/**
 * @typedef {Object} ProductQueryParams
 * @property {string}  [search]
 * @property {string}  [category]
 * @property {number}  [outlet_id]
 * @property {number}  [per_page]
 * @property {number}  [page]
 */

/**
 * @typedef {Object} CreateProductData
 * @property {string}  name
 * @property {string}  [sku]
 * @property {string}  [barcode]
 * @property {string}  [description]
 * @property {number}  [category_id]
 * @property {number}  price
 * @property {number}  [cost_price]
 * @property {string}  [unit]
 * @property {boolean} [track_stock]
 * @property {boolean} [is_active]
 * @property {number}  [outlet_id]
 */

/**
 * @typedef {Partial<CreateProductData>} UpdateProductData
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {T[]}    data
 * @property {number} current_page
 * @property {number} last_page
 * @property {number} per_page
 * @property {number} total
 * @property {string|null} next_page_url
 * @template T
 */
