import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Level } from "entities/level.entity";
import { Unit } from "entities/unit.entity";
import { UnitController } from "./unit.controller";
import { UnitService } from "./unit.service";

@Module({
  imports: [SequelizeModule.forFeature([Level, Unit])],
  controllers: [UnitController],
  providers: [UnitService],
})
export class UnitModule {}
