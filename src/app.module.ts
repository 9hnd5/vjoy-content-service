import { InitialModule } from "@common";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SequelizeModule } from "@nestjs/sequelize";
import { camelCase } from "lodash";
import * as path from "path";
const contentEntityPath = path.join(__dirname, "entities/*.entity*");
const coreEntityPath = path.join(__dirname, "..", "nest-common-module/entities/*.entity*");
@Module({
  imports: [
    InitialModule.forRoot({ i18nPath: path.join(__dirname, "i18n") }),
    SequelizeModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return {
          dialect: "postgres",
          host: configService.get("DB_HOST"),
          port: configService.get("DB_PORT"),
          username: configService.get("DB_USER"),
          password: configService.get("DB_PASSWORD"),
          database: configService.get("DB_NAME"),
          retryDelay: 5000,
          retryAttempts: 0,
          logging: false,
          autoLoadModels: false,
          models: [coreEntityPath, contentEntityPath],
          modelMatch: (filename, exportMember) => {
            const modelName = camelCase(filename.substring(0, filename.indexOf(".entity"))).toLowerCase();
            return modelName === exportMember.toLowerCase();
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
