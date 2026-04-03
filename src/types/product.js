/**
 * @typedef {Object} Product
 * @property {number}       id
 * @property {string}       name
 * @property {string|null}  sku
 * @property {string|null}  barcode
 * @property {string|null}  description
 * @property {number|null}  category_id
 * @property {string|null}  category       – category name resolved on the server
 * @property {string}       price          – decimal string from API, e.g. "25000.00"
 * @property {string|null}  cost_price
 * @property {string|null}  unit
 * @property {boolean}      is_active
 * @property {boolean}      track_stock
 * @property {string|null}  image
 * @property {number|null}  [stock]        – populated when outlet_id is passed to the list endpoint
 */

/**
 * @typedef {Object} ProductQueryParams
 * @property {string}  [search]       – matches name, SKU, or barcode
 * @property {string}  [category]     – filter by category name
 * @property {number}  [outlet_id]    – also populates `stock` field per item
 * @property {number}  [per_page]
 * @property {number}  [page]
 */

/**
 * @typedef {Object} CreateProductData
 * @property {string}  name
 * @property {string}  [sku]                – must be unique
 * @property {string}  [barcode]
 * @property {string}  [description]
 * @property {string}  [category]           – category name string (not ID)
 * @property {number}  price
 * @property {number}  [cost_price]
 * @property {number}  [stock]              – initial stock quantity
 * @property {number}  [low_stock_threshold]
 * @property {string}  [unit]
 * @property {number}  [outlet_id]          – outlet to assign initial stock to
 * @property {boolean} [track_stock]        – default true
 * @property {boolean} [is_active]
 */

/**
 * @typedef {Object} UpdateProductData
 * @property {string}  [name]
 * @property {number}  [price]
 * @property {number}  [cost_price]
 * @property {number}  [stock]
 * @property {number}  [low_stock_threshold]
 * @property {string}  [category]           – category name string
 * @property {boolean} [is_active]
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
