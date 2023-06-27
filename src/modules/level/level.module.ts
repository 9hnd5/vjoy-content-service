import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Level } from "entities/level.entity";
import { Unit } from "entities/unit.entity";
import { LevelController } from "./level.controller";
import { LevelService } from "./level.service";
import { KidLesson } from "entities/kid-lesson.entity";

@Module({
  imports: [SequelizeModule.forFeature([Level, Unit, KidLesson])],
  controllers: [LevelController],
  providers: [LevelService],
})
export class LevelModule {}
