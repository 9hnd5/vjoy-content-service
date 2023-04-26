import { Module } from "@nestjs/common";
import { GameRuleService } from "./game-rule.service";
import { SequelizeModule } from "@nestjs/sequelize";
import { GameRule } from "entities/game-rule.entity";
import { GameRuleController } from "./game-rule.controller";

@Module({
  imports: [SequelizeModule.forFeature([GameRule])],
  providers: [GameRuleService],
  controllers: [GameRuleController],
})
export class GameRuleModule {}
