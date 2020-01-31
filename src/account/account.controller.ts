import { Controller, Body, Post } from "@nestjs/common";
import { AccountService } from "./account.service";
import { Account } from ".";
import { ApiOperation, ApiConflictResponse } from "@nestjs/swagger";

@Controller("account")
export class AccountController {
  constructor(private svc: AccountService) {}

  @Post()
  @ApiOperation({ operationId: "create_account" })
  @ApiConflictResponse()
  createAccount(@Body() account: Account) {
    return this.svc.create(account);
  }
}
