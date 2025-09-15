export class ResponseFormatter {
  public static Ok<T>({
    data,
    message = 'Request was successful',
  }: { data?: T; message?: string } = {}) {
    return {
      success: true,
      message,
      data: data === undefined ? null : data,
    };
  }
}
