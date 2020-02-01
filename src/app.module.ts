import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod
} from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AccountService } from "./account/account.service";
import { AccountController } from "./account/account.controller";
import { get } from "config";
import { accountModelDefinition } from "./account";
import { AuthController } from "./auth/auth.controller";
import { RequireTokenMiddleware } from "./auth/require-token.middleware";

const dbURL = get<string>("dbURL");

@Module({
  imports: [
    MongooseModule.forRoot(dbURL, {
      appname: "Twitter Clone",
      connectTimeoutMS: 10000,
      useNewUrlParser: true
    }),
    MongooseModule.forFeature([accountModelDefinition])
  ],
  controllers: [AppController, AccountController, AuthController],
  providers: [AppService, AccountService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequireTokenMiddleware)
      .exclude({ method: RequestMethod.POST, path: "account" })
      .forRoutes(AccountController);
  }
}
