import { KidDetail, User } from "@common";
import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { KidData } from "entities/kid-data.entity";
import { Level } from "entities/level.entity";
import { KidDataController } from "./kid-data.controller";
import { KidDataService } from "./kid-data.service";

@Module({
  imports: [SequelizeModule.forFeature([KidData, User, KidDetail, Level])],
  controllers: [KidDataController],
  providers: [KidDataService],
})
export class KidDataModule {}
