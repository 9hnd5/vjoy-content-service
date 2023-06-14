import { Authorize, Controller } from "@common";
import { Get, Query } from "@nestjs/common";
import { FindLevelsQueryDto } from "./dto/find-levels.dto";
import { LevelService } from "./level.service";
import { FindLevelSuggestionDto } from "./dto/find-level-suggestion.dto";

@Controller()
export class LevelController {
  constructor(private levelService: LevelService) {}

  @Authorize({ resource: "levels", action: "list" })
  @Get("levels")
  findAll(@Query() query: FindLevelsQueryDto) {
    return this.levelService.find(query);
  }

  @Authorize({ resource: "levels", action: "read" })
  @Get("level-suggestion")
  findSuggestion(@Query() query: FindLevelSuggestionDto) {
    return this.levelService.findSuggestion(query);
  }
}
