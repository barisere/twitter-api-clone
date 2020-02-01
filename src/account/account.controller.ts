import {
  Controller,
  Body,
  Post,
  Put,
  Request,
  BadRequestException
} from "@nestjs/common";
import { AccountService } from "./account.service";
import { Account } from ".";
import {
  ApiOperation,
  ApiConflictResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBadRequestResponse
} from "@nestjs/swagger";
import { ApiDataResponse, ApiErrorResponse } from "../common/api-response";

@Controller("account")
export class AccountController {
  constructor(private svc: AccountService) {}

  @Post()
  @ApiOperation({ operationId: "create_account" })
  @ApiConflictResponse()
  async createAccount(@Body() account: Account) {
    return new ApiDataResponse(await this.svc.create(account));
  }

  @Put("following")
  @ApiOperation({ operationId: "follow_account" })
  @ApiBearerAuth()
  @ApiOkResponse()
  @ApiBadRequestResponse()
  async follow(@Body("username") userToFollow: string, @Request() req) {
    const requestingUser = req.user;
    const update = await this.svc.addFollower(requestingUser, userToFollow);

    return new ApiDataResponse(update);
  }
}
