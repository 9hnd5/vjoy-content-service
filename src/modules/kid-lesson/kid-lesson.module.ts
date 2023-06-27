import { Module } from "@nestjs/common";
import { KidLessonService } from "./kid-lesson.service";
import { KidLessonController } from "./kid-lesson.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { KidData } from "entities/kid-data.entity";
import { KidLesson } from "entities/kid-lesson.entity";
import { GameRule } from "entities/game-rule.entity";
import { Lesson } from "entities/lesson.entity";

@Module({
  imports: [SequelizeModule.forFeature([KidData, KidLesson, GameRule, Lesson])],
  providers: [KidLessonService],
  controllers: [KidLessonController],
})
export class KidLessonModule {}
