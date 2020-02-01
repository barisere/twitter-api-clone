import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle("Twitter Clone (API)")
    .setVersion("0.1.0")
    .addBearerAuth({ bearerFormat: "jwt", type: "apiKey", in: "header" })
    .build();
  options.openapi = "3.0.1";

  const swaggerDoc = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup("/api-doc", app, swaggerDoc, {
    explorer: true
  });

  await app.listen(3000);
}
bootstrap();
