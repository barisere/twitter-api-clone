import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import * as assert from "assert";

const maxTweetLength = 240;

export class Tweet {
  constructor(message: string, author: string, inReplyTo?: string) {
    assert.ok(
      message.length > 0 && message.length <= maxTweetLength,
      `Tweets must be between 0 and ${maxTweetLength} in length`
    );
    assert.ok(author, "No orphan tweets allowed");
    this.message = message;
    this.author = author;
    this.date = new Date();
    this.inReplyTo = inReplyTo ?? void 0;
  }
  @ApiProperty()
  id: string;

  @ApiProperty({
    description: "The message content of the tweet",
    maxLength: maxTweetLength,
    minLength: 1
  })
  message: string;

  @ApiProperty({
    description: "The date on which the tweet was posted",
    type: String,
    format: "date-time"
  })
  date: Date;

  @ApiProperty({
    description: "The username of the account that posted the tweet."
  })
  author: string;

  @ApiPropertyOptional({
    description: "The ID of the tweet to which this was a reply, if any."
  })
  inReplyTo?: string;
}
