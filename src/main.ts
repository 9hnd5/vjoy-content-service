import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { EnvironmentService } from "@common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const envService = app.get(EnvironmentService);
  app.enableCors();
  app.enableVersioning();
  app.setGlobalPrefix("api");
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle("Vjoy-Content")
    .setDescription("The documentation vjoy-content")
    .setVersion("1.0")
    .addTag("vjoy-content")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/v1/content/api-docs", app, document);
  await app.listen(envService.get("PORT")!);
}
bootstrap();
