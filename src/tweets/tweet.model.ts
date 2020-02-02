import { Schema, SchemaTypes, Document } from "mongoose";
import { ModelDefinition } from "@nestjs/mongoose";
import { Tweet } from "./tweet";

export const tweetSchema = new Schema({
  message: {
    type: SchemaTypes.String,
    required: true
  },
  date: {
    type: SchemaTypes.Date,
    default() {
      return new Date();
    }
  },
  author: {
    type: SchemaTypes.String,
    ref: "Account",
    required: true
  },
  inReplyTo: {
    type: SchemaTypes.ObjectId,
    ref: "Tweet"
  }
});

tweetSchema.index(
  { message: "text", author: "text" },
  { weights: { message: 2, author: 1 } }
);

export const tweetModelDefinition: ModelDefinition = {
  name: "Tweet",
  schema: tweetSchema,
  collection: "tweets"
};

export interface TweetModel extends Tweet, Document {
  id: string;
}
