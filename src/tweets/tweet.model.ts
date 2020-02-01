import { Schema, SchemaTypes, Document } from "mongoose";
import { ModelDefinition } from "@nestjs/mongoose";

export const tweetSchema = new Schema({
  message: {
    type: SchemaTypes.String,
    required: true,
    index: "text"
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

export const tweetModelDefinition: ModelDefinition = {
  name: "Tweet",
  schema: tweetSchema,
  collection: "tweets"
};

export interface Tweet extends Document {}
