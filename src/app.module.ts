import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AccountService } from "./account/account.service";
import { AccountController } from "./account/account.controller";
import { get } from "config";
import { accountModelDefinition } from "./account";
import { AuthController } from './auth/auth.controller';

const dbURL = get<string>("dbURL");

console.log(dbURL);

@Module({
  imports: [
    MongooseModule.forRoot(dbURL, {
      appname: "Twitter Clone",
      connectTimeoutMS: 10000,
      useNewUrlParser: true,
    }),
    MongooseModule.forFeature([accountModelDefinition])
  ],
  controllers: [AppController, AccountController, AuthController],
  providers: [AppService, AccountService]
})
export class AppModule {}
