import { Get, Query } from "@nestjs/common";
import { GameRuleService } from "./game-rule.service";
import { Authorize, Controller } from "@common";
import { FindGameRulesQueryDto } from "./dto/find-game-rules.query.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("game-rules")
@ApiBearerAuth()
export class GameRuleController {
  constructor(private gameRuleService: GameRuleService) {}

  @Authorize({ resource: "game-rules", action: "list" })
  @Get()
  findAll(@Query() query: FindGameRulesQueryDto) {
    return this.gameRuleService.findAll(query);
  }
}
