import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Lesson } from "entities/lesson.entity";
import { Unit } from "entities/unit.entity";
import { LessonController } from "./lesson.controller";
import { LessonService } from "./lesson.service";
import { GameRule } from "entities/game-rule.entity";
import { KidLesson } from "entities/kid-lesson.entity";

@Module({
  imports: [SequelizeModule.forFeature([Lesson, Unit, GameRule, KidLesson])],
  controllers: [LessonController],
  providers: [LessonService],
})
export class LessonModule {}
