import { Module } from "@nestjs/common";
import { KidLearningDataController } from "./kid-learning-data.controller";
import { KidLearningDataService } from "./kid-learning-data.service";
import { SequelizeModule } from "@nestjs/sequelize";
import { KidLearningData } from "entities/kid-learning-data.entity";
import { KidLessonProgress } from "entities/kid-lesson-progress.entity";
import { GameRule } from "entities/game-rule.entity";

@Module({
  imports: [SequelizeModule.forFeature([KidLearningData, KidLessonProgress, GameRule])],
  controllers: [KidLearningDataController],
  providers: [KidLearningDataService],
})
export class KidLearningDataModule {}
