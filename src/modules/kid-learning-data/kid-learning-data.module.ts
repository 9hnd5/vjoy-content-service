import { Module } from "@nestjs/common";
import { KidLearningDataController } from "./kid-learning-data.controller";
import { KidLearningDataService } from "./kid-learning-data.service";
import { SequelizeModule } from "@nestjs/sequelize";
import { KidLearningData } from "entities/kid-learning-data.entity";

@Module({
  imports: [SequelizeModule.forFeature([KidLearningData])],
  controllers: [KidLearningDataController],
  providers: [KidLearningDataService],
})
export class KidLearningDataModule {}
