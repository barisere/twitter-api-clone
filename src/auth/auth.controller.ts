import { Controller, Post, Body, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { accountModelDefinition, Account } from "../account";
import { Model } from "mongoose";
import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { get } from "config";
import {
  ApiOkResponse,
  ApiOperation,
  ApiBadRequestResponse,
  ApiBody
} from "@nestjs/swagger";
import { ApiErrorResponse } from "../common/api-response";
import { LoginDto } from "../common/login-dto";
import { SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";

const secretKey = get<string>("jwtSecretKey");

function makeAuthToken(username: string) {
  const validForSeconds = 60;
  const token = sign({}, secretKey, {
    subject: username,
    expiresIn: validForSeconds
  });
  return token;
}

const tokenSchema: SchemaObject = {
  properties: {
    data: {
      type: "object",
      properties: { token: { type: "string" } }
    }
  }
};

@Controller("auth")
export class AuthController {
  constructor(
    @InjectModel(accountModelDefinition.name) private accountDB: Model<Account>
  ) {}

  @Post("login")
  @ApiOperation({
    operationId: "login",
    description:
      "Obtain a token with which you can access restricted API endpoints."
  })
  @ApiOkResponse({
    schema: tokenSchema,
    description: "A JWT token to identify the user."
  })
  @ApiBody({ type: LoginDto })
  @ApiBadRequestResponse({
    description: "An incorrect password was provided.",
    type: ApiErrorResponse
  })
  async login(
    @Body("username") username: string,
    @Body("password") password: string
  ) {
    const account = await this.accountDB.findById(username).exec();
    const isCorrectPassword = await compare(password, account?.password ?? "");
    if (!isCorrectPassword) {
      throw new ApiErrorResponse(
        {
          code: "auth/incorrect_credentials"
        },
        HttpStatus.BAD_REQUEST
      );
    }
    return { data: { token: makeAuthToken(username) } };
  }
}
