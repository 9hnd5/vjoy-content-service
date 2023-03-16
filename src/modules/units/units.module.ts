import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Level } from "entities/level.entity";
import { Unit } from "entities/unit.entity";
import { UnitsController } from "./units.controller";
import { UnitsService } from "./units.service";

@Module({
  imports: [SequelizeModule.forFeature([Level, Unit])],
  controllers: [UnitsController],
  providers: [UnitsService],
})
export class UnitsModule {}
