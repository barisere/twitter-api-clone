export class ApiDataResponse<T> {
  constructor(public data: T) {}
}

export class ApiErrorResponse<T extends { code: string }> {
  constructor(public error: T) {}
}
