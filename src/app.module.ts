import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod
} from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppService } from "./app.service";
import { AccountService } from "./account/account.service";
import { AccountController } from "./account/account.controller";
import { get } from "config";
import { accountModelDefinition } from "./account";
import { AuthController } from "./auth/auth.controller";
import { RequireTokenMiddleware } from "./auth/require-token.middleware";
import { TweetsController } from "./tweets/tweets.controller";
import { tweetModelDefinition } from "./tweets/tweet.model";
import { SearchController } from './search/search.controller';

const dbURL = get<string>("dbURL");

@Module({
  imports: [
    MongooseModule.forRoot(dbURL, {
      appname: "Twitter Clone",
      connectTimeoutMS: 10000,
      useNewUrlParser: true
    }),
    MongooseModule.forFeature([accountModelDefinition, tweetModelDefinition])
  ],
  controllers: [AccountController, AuthController, TweetsController, SearchController],
  providers: [AppService, AccountService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequireTokenMiddleware)
      .exclude({ method: RequestMethod.POST, path: "account" })
      .forRoutes(AccountController, TweetsController);
  }
}
