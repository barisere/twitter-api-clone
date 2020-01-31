import {
  Injectable,
  BadRequestException,
  ConflictException
} from "@nestjs/common";
import { Account, accountModelDefinition } from ".";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { hash, genSalt } from "bcrypt";
import { ApiErrorResponse } from "../common/api-response";

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(accountModelDefinition.name) private accountDB: Model<Account>
  ) {}

  async create(account: Account) {
    if (!account.password) {
      throw new BadRequestException(
        new ApiErrorResponse({ code: "account/password_required" })
      );
    }
    try {
      const salt = await genSalt();
      const password = await hash(account.password, salt);
      const _account = await this.accountDB.create({ ...account, password });
      return _account;
    } catch (error) {
      if (error.name === "MongoError" && error.code === 11000) {
        throw new ConflictException(
          new ApiErrorResponse({
            code: "account/duplicate",
            details: {
              username: account.username
            }
          })
        );
      }
      throw error;
    }
  }
}
