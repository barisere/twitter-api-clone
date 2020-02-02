import { ApiProperty } from "@nestjs/swagger";
import { HttpException } from "@nestjs/common";

export class ApiErrorResponse<
  T extends { code: string }
> extends HttpException {
  @ApiProperty({
    description:
      "Information about the error; it may contain a `code` property that identifies the kind of error."
  })
  error: T;

  constructor(error: T, status: number) {
    super({ error }, status);
  }
}
