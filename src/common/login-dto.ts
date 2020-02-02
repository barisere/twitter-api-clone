import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ description: "Account username, unique across accounts." })
  username: string;

  @ApiProperty()
  password: string;
}
