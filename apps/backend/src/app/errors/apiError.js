export class ApiError extends Error {
  status;
  message;
  constructor(status, message) {
    super();
    this.status = status;
    this.message = message;
  }

  static BadRequest(message) {
    return new ApiError(400, message);
  }

  static UnAuthorization(message) {
    return new ApiError(401, 'Пользователь не авторизован. ' + !!message ? message : '');
  }

  static httpForbidden() {
    return new ApiError(403, 'У пользователя недостаточно прав');
  }

  static UnProcessableEntity(message) {
    return new ApiError(422, message);
  }

  static InternalServerError(message) {
    return new ApiError(500, message);
  }

  static NotFound(message) {
    return new ApiError(404, message);
  }

  static Conflict(message) {
    return new ApiError(409, message);
  }
}
