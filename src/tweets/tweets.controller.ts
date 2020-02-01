import {
  Controller,
  Post,
  Body,
  Request,
  BadRequestException,
  NotFoundException
} from "@nestjs/common";
import {
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiCreatedResponse
} from "@nestjs/swagger";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { tweetModelDefinition, Tweet as TweetModel } from "./tweet.model";
import { Tweet } from "./tweet";
import { AssertionError } from "assert";
import { ApiErrorResponse, ApiDataResponse } from "../common/api-response";
import { ObjectID } from "mongodb";

@Controller("tweets")
export class TweetsController {
  constructor(
    @InjectModel(tweetModelDefinition.name) private tweetDB: Model<TweetModel>
  ) {}

  @Post()
  @ApiOperation({ operationId: "post_tweet" })
  @ApiUnauthorizedResponse()
  @ApiCreatedResponse()
  async create(
    @Body() t: Pick<Tweet, "message" | "inReplyTo">,
    @Request() req
  ) {
    if (t.inReplyTo) {
      const notFoundException = new NotFoundException(
        new ApiErrorResponse({ code: "tweets/not_found" })
      );

      if (!ObjectID.isValid(t.inReplyTo)) {
        throw notFoundException;
      }

      const previousTweet = await this.tweetDB.findById(t.inReplyTo);
      if (previousTweet == null) {
        throw notFoundException;
      }
    }

    try {
      const tweet = new Tweet(t.message, req.user, t.inReplyTo);
      const newTweet = await this.tweetDB.create(tweet);
      return new ApiDataResponse(newTweet);
    } catch (error) {
      if (error instanceof AssertionError) {
        throw new BadRequestException(
          new ApiErrorResponse({
            code: "tweets/malformed_request",
            message: error.message
          })
        );
      }
      throw error;
    }
  }
}
