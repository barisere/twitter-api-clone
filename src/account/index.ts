import { ApiProperty } from "@nestjs/swagger";
import { Schema, SchemaTypes, Document } from "mongoose";
import { ModelDefinition } from "@nestjs/mongoose";

export const accountSchema = new Schema({
    username: {
        type: SchemaTypes.String,
        unique: true,
        required: true,
    },
    password: {
        type: SchemaTypes.String,
        required: true,
    },
})

export const accountModelDefinition: ModelDefinition = {
    name: "Account",
    schema: accountSchema,
    collection: "accounts",
};

export class Account {
    @ApiProperty({ description: "A unique identifier for an account." })
    username: string;

    password: string;
}

export interface Account extends Document {}