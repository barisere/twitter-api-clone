import { Controller, Get, Query } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { accountModelDefinition, Account } from "../account";
import { Model, Document } from "mongoose";
import { tweetModelDefinition, TweetModel } from "../tweets/tweet.model";
import { ApiOkResponse, ApiOperation, ApiProperty } from "@nestjs/swagger";
import { Tweet } from "../tweets/tweet";

class SearchResults {
  @ApiProperty({ type: Account, isArray: true })
  accounts: Account[];

  @ApiProperty({ type: Tweet, isArray: true })
  tweets: Tweet[];
}

class SearchResponse {
  @ApiProperty()
  data: SearchResults;
}

@Controller("search")
export class SearchController {
  constructor(
    @InjectModel(accountModelDefinition.name) private accountDB: Model<Account>,
    @InjectModel(tweetModelDefinition.name) private tweetDB: Model<TweetModel>
  ) {}

  @Get()
  @ApiOperation({ operationId: "search" })
  @ApiOkResponse({ type: SearchResponse })
  async search(@Query() query: { q?: string; type?: "account" | "tweet" }) {
    let tweets = [];
    let accounts = [];

    if (!query.q) {
      return { data: { tweets, accounts } };
    }

    switch (query.type) {
      case "tweet": {
        tweets = await searchTweets(query.q, this.tweetDB);
        break;
      }
      case "account": {
        accounts = await searchAccounts(query.q, this.accountDB);
        break;
      }
      default: {
        [accounts, tweets] = await searchAll(
          query.q,
          this.accountDB,
          this.tweetDB
        );
      }
    }

    return {
      data: { tweets, accounts }
    };
  }
}

function removeFields<T extends Document>(doc: T, ...fields: string[]) {
  fields.forEach(f => {
    doc.set(f, void 0);
  });
}

function searchTweets($search: string, db: Model<TweetModel>) {
  return db
    .find({ $text: { $search } }, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .map(tweets => {
      tweets.forEach(t => removeFields(t, "score", "_id", "__v"));
      return tweets;
    })
    .exec();
}

function searchAccounts($search: string, db: Model<Account>) {
  return db
    .find({ $text: { $search } }, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .map(accounts => {
      accounts.forEach(a => removeFields(a, "score", "_id", "__v", "password"));
      return accounts;
    })
    .exec();
}

function searchAll(
  $search: string,
  accountDB: Model<Account>,
  tweetDB: Model<TweetModel>
) {
  return Promise.all([
    searchAccounts($search, accountDB),
    searchTweets($search, tweetDB)
  ]);
}
