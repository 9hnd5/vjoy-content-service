import { Authorize, Controller } from "@common";
import { Get, Param, Query } from "@nestjs/common";
import { FindLevelsQueryDto } from "./dto/find-levels.dto";
import { LevelService } from "./level.service";
import { FindLevelSuggestionDto } from "./dto/find-level-suggestion.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller()
@ApiBearerAuth()
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

  @Authorize({ resource: "levels", action: "read" })
  @Get("world-map/:levelId/kid/:kidId")
  findOne(@Param("levelId") levelId: string, @Param("kidId") kidId: number) {
    return this.levelService.worldMap(levelId, kidId);
  }
}
