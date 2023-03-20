import { Authorize, Controller } from "@common";
import { Get, Query } from "@nestjs/common";
import { FindLevelsQueryDto } from "./dto/find-levels.dto";
import { LevelService } from "./level.service";

@Controller("levels")
export class LevelController {
  constructor(private levelService: LevelService) {}

  @Authorize({ resource: "levels", action: "list" })
  @Get()
  findAll(@Query() query: FindLevelsQueryDto) {
    return this.levelService.findAll(query);
  }
}
