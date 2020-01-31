import { Controller, Post, Body, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { accountModelDefinition, Account } from "../account";
import { Model } from "mongoose";
import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { get } from "config";
import {
  ApiOkResponse,
  ApiOperation,
  ApiBadRequestResponse
} from "@nestjs/swagger";
import { ApiDataResponse, ApiErrorResponse } from "../common/api-response";

const secretKey = get<string>("jwtSecretKey");

function makeAuthToken(username: string) {
  const validForSeconds = 60;
  const token = sign({}, secretKey, {
    subject: username,
    expiresIn: validForSeconds
  });
  return token;
}

@Controller("auth")
export class AuthController {
  constructor(
    @InjectModel(accountModelDefinition.name) private accountDB: Model<Account>
  ) {}

  @Post("login")
  @ApiOperation({ operationId: "login" })
  @ApiOkResponse({
    type: String,
    description: "A JWT token to identify the user."
  })
  @ApiBadRequestResponse()
  async login(
    @Body("username") username: string,
    @Body("password") password: string
  ) {
    const _account = await this.accountDB.findOne({ username }).exec();
    const isCorrectPassword = await compare(password, _account.password);
    if (!isCorrectPassword) {
      throw new BadRequestException(
        new ApiErrorResponse({
          code: "auth/incorrect_credentials"
        })
      );
    }
    return new ApiDataResponse({ token: makeAuthToken(username) });
  }
}
