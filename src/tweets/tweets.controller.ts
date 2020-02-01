import {
  Controller,
  Post,
  Body,
  Request,
  Get,
  Query,
  HttpStatus
} from "@nestjs/common";
import {
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiProperty
} from "@nestjs/swagger";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { tweetModelDefinition, TweetModel } from "./tweet.model";
import { Tweet } from "./tweet";
import { AssertionError } from "assert";
import { ApiErrorResponse } from "../common/api-response";
import { ObjectID } from "mongodb";

class PostTweetDto {
  @ApiProperty({
    description: "The tweet message body.",
    maxLength: 240,
    minLength: 1
  })
  message: string;

  @ApiProperty({
    required: false,
    description: "The ID of the tweet to reply to"
  })
  inReplyTo?: string;
}

class TweetDto<T extends Tweet> {
  constructor(data: T) {
    this.data = data;
  }
  @ApiProperty()
  data: Tweet;
}

class TweetTimeline<T extends Tweet> {
  @ApiProperty()
  data: Tweet[];

  constructor(data: T[]) {
    this.data = data;
  }
}

@Controller("tweets")
export class TweetsController {
  constructor(
    @InjectModel(tweetModelDefinition.name) private tweetDB: Model<TweetModel>
  ) {}

  @Post()
  @ApiOperation({ operationId: "post_tweet" })
  @ApiUnauthorizedResponse({
    description: "A valid authentication token is required.",
    type: ApiErrorResponse
  })
  @ApiCreatedResponse({ type: TweetDto })
  @ApiBearerAuth()
  async create(@Body() t: PostTweetDto, @Request() req) {
    if (t.inReplyTo) {
      const notFoundException = new ApiErrorResponse(
        { code: "tweets/not_found" },
        HttpStatus.NOT_FOUND
      );

      if (!ObjectID.isValid(t.inReplyTo)) {
        throw notFoundException;
      }

      const previousTweet = await this.tweetDB.findById(t.inReplyTo).exec();
      if (previousTweet == null) {
        throw notFoundException;
      }
    }

    try {
      const tweet = new Tweet(t.message, req.user, t.inReplyTo);
      const newTweet = await this.tweetDB.create(tweet);
      return new TweetDto(newTweet);
    } catch (error) {
      if (error instanceof AssertionError) {
        throw new ApiErrorResponse(
          {
            code: "tweets/malformed_request",
            message: error.message
          },
          HttpStatus.BAD_REQUEST
        );
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({ operationId: "view_user_timeline" })
  @ApiOkResponse({ type: TweetTimeline, isArray: true })
  @ApiBearerAuth()
  async viewTimeline(@Query("author") author: string) {
    const tweets = await this.tweetDB.find({ author }).exec();
    return new TweetTimeline(tweets);
  }
}
