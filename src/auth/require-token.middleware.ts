import { Injectable, NestMiddleware, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { ApiErrorResponse } from "../common/api-response";
import { verify, TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { get } from "config";

const jwtSecretKey = get<string>("jwtSecretKey");

@Injectable()
export class RequireTokenMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    const token = req.headers.authorization?.split("Bearer ")?.[1]?.trim();
    if (!token) {
      return respondWithUnauthorized(res, "auth/token_required");
    }
    verify(token, jwtSecretKey, (err, decodedToken: any) => {
      if (err instanceof TokenExpiredError) {
        return respondWithUnauthorized(res, "auth/token_required");
      }
      if (err instanceof JsonWebTokenError) {
        return respondWithUnauthorized(res, "auth/invalid_token");
      }
      req["user"] = decodedToken.sub;
      next();
    });
  }
}
function respondWithUnauthorized(res: Response, code: string): void {
  return res
    .status(HttpStatus.UNAUTHORIZED)
    .json(new ApiErrorResponse({ code }))
    .end();
}
