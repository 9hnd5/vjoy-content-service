import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { GameRule } from "entities/game-rule.entity";
import { FindGameRulesQueryDto } from "./dto/find-game-rules.query.dto";

@Injectable()
export class GameRuleService {
  constructor(@InjectModel(GameRule) private gameRuleModel: typeof GameRule) {}

  findAll = (query: FindGameRulesQueryDto) => {
    const { limit, offset } = query;
    return this.gameRuleModel.findAndCountAll({ limit, offset });
  };
}
