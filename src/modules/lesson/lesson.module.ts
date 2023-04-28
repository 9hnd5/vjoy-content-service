import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Lesson } from "entities/lesson.entity";
import { Unit } from "entities/unit.entity";
import { LessonController } from "./lesson.controller";
import { LessonService } from "./lesson.service";
import { GameRule } from "entities/game-rule.entity";
import { KidLessonProgress } from "entities/kid-lesson-progress.entity";

@Module({
  imports: [SequelizeModule.forFeature([Lesson, Unit, GameRule, KidLessonProgress])],
  controllers: [LessonController],
  providers: [LessonService],
})
export class LessonModule {}
