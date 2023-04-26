import { Get, Query } from "@nestjs/common";
import { GameRuleService } from "./game-rule.service";
import { Authorize, Controller } from "@common";
import { FindGameRulesQueryDto } from "./dto/find-game-rules.query.dto";

@Controller("game-rules")
export class GameRuleController {
  constructor(private gameRuleService: GameRuleService) {}

  @Authorize({ resource: "game-rules", action: "list" })
  @Get()
  findAll(@Query() query: FindGameRulesQueryDto) {
    return this.gameRuleService.findAll(query);
  }
}
