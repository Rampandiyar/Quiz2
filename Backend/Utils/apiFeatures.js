export class APIFeatures {
  /**
   * @param {mongoose.Query} query - Mongoose query
   * @param {Object} queryString - Request query string
   */
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * Filter the query
   * @returns {APIFeatures} Current instance
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  /**
   * Sort the query
   * @returns {APIFeatures} Current instance
   */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  /**
   * Limit fields
   * @returns {APIFeatures} Current instance
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  /**
   * Paginate the query
   * @returns {APIFeatures} Current instance
   */
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  /**
   * Search the query
   * @param {Array} fields - Fields to search in
   * @returns {APIFeatures} Current instance
   */
  search(fields = []) {
    if (this.queryString.search) {
      const searchQuery = {
        $or: fields.map(field => ({
          [field]: { $regex: this.queryString.search, $options: 'i' }
        }))
      };
      this.query = this.query.find(searchQuery);
    }
    return this;
  }
}