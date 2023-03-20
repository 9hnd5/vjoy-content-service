import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Level } from "entities/level.entity";
import { LevelController } from "./level.controller";
import { LevelService } from "./level.service";

@Module({
  imports: [SequelizeModule.forFeature([Level])],
  controllers: [LevelController],
  providers: [LevelService],
})
export class LevelModule {}
