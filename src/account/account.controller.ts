import { Controller, Body, Post, Put, Request } from "@nestjs/common";
import { AccountService } from "./account.service";
import {
  ApiOperation,
  ApiConflictResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiBody,
  ApiProperty,
  ApiCreatedResponse
} from "@nestjs/swagger";
import { LoginDto } from "../common/login-dto";
import { Account } from ".";
import { ApiErrorResponse } from "../common/api-response";

class FollowAccountRequest {
  @ApiProperty({ description: "The username of the account to follow." })
  username: string;
}

class FollowAccountResponse {
  constructor(data: Account) {
    this.data = data;
  }
  @ApiProperty()
  data: Account;
}

class CreateAccountResponse {
  constructor(data: Account) {
    this.data = data;
  }

  @ApiProperty()
  data: Account;
}

@Controller("account")
export class AccountController {
  constructor(private svc: AccountService) {}

  @Post()
  @ApiOperation({ operationId: "create_account" })
  @ApiCreatedResponse({ type: CreateAccountResponse })
  @ApiConflictResponse({
    description: "Username already exists.",
    type: ApiErrorResponse
  })
  async createAccount(@Body() account: LoginDto) {
    return new CreateAccountResponse(await this.svc.create(account));
  }

  @Put("following")
  @ApiOperation({ operationId: "follow_account" })
  @ApiBearerAuth("apiKey")
  @ApiBody({ type: FollowAccountRequest })
  @ApiOkResponse({ type: FollowAccountResponse })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  async follow(@Body("username") userToFollow: string, @Request() req) {
    const requestingUser = req.user;
    const update = await this.svc.addFollower(requestingUser, userToFollow);

    return new FollowAccountResponse(update);
  }
}
