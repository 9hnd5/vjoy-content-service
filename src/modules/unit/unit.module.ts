import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Level } from "entities/level.entity";
import { Unit } from "entities/unit.entity";
import { UnitController } from "./unit.controller";
import { UnitService as UnitService } from "./unit.service";
import { KidLessonProgress } from "entities/kid-lesson-progress.entity";
import { GameRule } from "entities/game-rule.entity";

@Module({
  imports: [SequelizeModule.forFeature([Level, Unit, GameRule, KidLessonProgress])],
  controllers: [UnitController],
  providers: [UnitService],
})
export class UnitModule {}
