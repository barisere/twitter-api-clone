import { ApiProperty } from "@nestjs/swagger";
import { HttpException } from "@nestjs/common";

export class ApiErrorResponse<
  T extends { code: string }
> extends HttpException {
  @ApiProperty({ description: "Information about the error" })
  error: T;

  constructor(error: T, status: number) {
    super({ error }, status);
  }
}
