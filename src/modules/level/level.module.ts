import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { KidLessonProgress } from "entities/kid-lesson-progress.entity";
import { Level } from "entities/level.entity";
import { Unit } from "entities/unit.entity";
import { LevelController } from "./level.controller";
import { LevelService } from "./level.service";

@Module({
  imports: [SequelizeModule.forFeature([Level, Unit, KidLessonProgress])],
  controllers: [LevelController],
  providers: [LevelService],
})
export class LevelModule {}
