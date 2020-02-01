import { Injectable, HttpStatus } from "@nestjs/common";
import { Account, accountModelDefinition } from ".";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { hash, genSalt } from "bcrypt";
import { ApiErrorResponse } from "../common/api-response";
import { LoginDto } from "../common/login-dto";

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(accountModelDefinition.name) private accountDB: Model<Account>
  ) {}

  async create(account: LoginDto) {
    if (!account.password) {
      throw new ApiErrorResponse(
        { code: "account/password_required" },
        HttpStatus.BAD_REQUEST
      );
    }
    try {
      const salt = await genSalt();
      const password = await hash(account.password, salt);
      const _account = await this.accountDB.create({ ...account, password });
      delete _account.password;
      return _account;
    } catch (error) {
      if (error.name === "MongoError" && error.code === 11000) {
        throw new ApiErrorResponse(
          {
            code: "account/duplicate",
            details: {
              username: account.username
            }
          },
          HttpStatus.CONFLICT
        );
      }
      throw error;
    }
  }

  async addFollower(username: string, userToFollow: string) {
    const followedUser = await this.accountDB.findById(userToFollow);
    if (!followedUser) {
      throw new ApiErrorResponse(
        {
          code: "account/unknown_account",
          username: userToFollow
        },
        HttpStatus.BAD_REQUEST
      );
    }
    const user = await this.accountDB
      .findByIdAndUpdate(
        username,
        {
          $addToSet: { following: userToFollow }
        },
        { new: true }
      )
      .exec();

    return user;
  }
}
