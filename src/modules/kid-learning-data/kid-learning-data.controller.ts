import { Authorize, Controller } from "@common";
import { Body, Param, Post } from "@nestjs/common";
import { KidLearningDataService } from "./kid-learning-data.service";
import { CreateUpdateKidLessonProgressDto } from "./dto/create-update-kid-lesson-progress.dto";

@Controller("kid-learning-data")
export class KidLearningDataController {
  constructor(private kidLearningDataService: KidLearningDataService) {}

  @Authorize({ resource: "kid-learning-data", action: "update" })
  @Post("/:id/energy")
  buyEnergy(@Param("id") id: number) {
    return this.kidLearningDataService.buyEnergy(id);
  }

  @Authorize({ resource: "kid-lesson-progresses", action: "create" })
  @Post("/:id/kid-lesson-progresses")
  createUpdateKidLessonProgress(@Param("id") id: number, @Body() data: CreateUpdateKidLessonProgressDto) {
    return this.kidLearningDataService.createUpdateLearningProgress(id, data);
  }
}
