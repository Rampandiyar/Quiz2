/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 * @param {string} message - Success message
 */
export const successResponse = (res, statusCode, data, message = 'Success') => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} errors - Additional error details
 */
export const errorResponse = (res, statusCode, message, errors = {}) => {
  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

/**
 * Paginated response formatter
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Array} data - Response data
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Success message
 */
export const paginatedResponse = (
  res,
  statusCode,
  data,
  total,
  page,
  limit,
  message = 'Success'
) => {
  const totalPages = Math.ceil(total / limit);
  
  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  });
};