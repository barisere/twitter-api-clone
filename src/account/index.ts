import { ApiProperty } from "@nestjs/swagger";
import { Schema, SchemaTypes, Document, HookNextFunction } from "mongoose";
import { ModelDefinition } from "@nestjs/mongoose";

export const accountSchema = new Schema({
  _id: {
    type: SchemaTypes.String
  },
  username: {
    type: SchemaTypes.String,
    unique: true,
    required: true
  },
  following: {
    type: [SchemaTypes.String],
    ref: "Account",
    default: []
  },
  password: {
    type: SchemaTypes.String,
    required: true
  }
});

accountSchema.index({ username: "text" });

function setIdToUsername(next: HookNextFunction): void {
  if (this.username) {
    this._id = this.username;
  }
  next();
}

accountSchema
  .pre("save", setIdToUsername)
  .pre("updateOne", setIdToUsername)
  .pre("validate", setIdToUsername);

export const accountModelDefinition: ModelDefinition = {
  name: "Account",
  schema: accountSchema,
  collection: "accounts"
};

export class Account {
  _id: string;

  @ApiProperty({ description: "A unique identifier for an account." })
  username: string;

  @ApiProperty({
    description: "Other accounts whose tweets this account subscribes to."
  })
  following: Account[];

  password: string;
}

export interface Account extends Document {}
