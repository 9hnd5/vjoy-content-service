import { Authorize, Controller } from "@common";
import { Body, Param, Patch, Post } from "@nestjs/common";
import { KidLearningDataService } from "./kid-learning-data.service";
import { CreateUpdateKidLessonProgressDto } from "./dto/create-update-kid-lesson-progress.dto";
import { UpdateEnergyDto } from "./dto/update-energy.dto";
import { CreateKidLearningDataDto } from "./dto/create-kid-learning-data.dto";
import { UpdateKidLearningDataDto } from "./dto/update-kid-learning-data.dto";

@Controller("kid-learning-data")
export class KidLearningDataController {
  constructor(private kidLearningDataService: KidLearningDataService) {}

  @Authorize({ resource: "kid-learning-data", action: "create" })
  @Post()
  createKidLearningData(@Body() data: CreateKidLearningDataDto) {
    return this.kidLearningDataService.create(data);
  }

  @Authorize({ resource: "kid-learning-data", action: "update" })
  @Patch(":kidId")
  updateKidLearningData(@Param("kidId") kidId: number, @Body() data: UpdateKidLearningDataDto) {
    return this.kidLearningDataService.update(kidId, data);
  }

  @Authorize({ resource: "kid-learning-data", action: "update" })
  @Post("/:id/energy")
  buyEnergy(@Param("id") id: number) {
    return this.kidLearningDataService.buyEnergy(id);
  }

  @Authorize({ resource: "kid-learning-data", action: "update" })
  @Patch("/:id/energy")
  updateEnergy(@Param("id") id: number, @Body() data: UpdateEnergyDto) {
    return this.kidLearningDataService.updateEnergy(id, data.energy);
  }

  @Authorize({ resource: "kid-lesson-progresses", action: "create" })
  @Post("/:id/kid-lesson-progresses")
  createUpdateKidLessonProgress(@Param("id") id: number, @Body() data: CreateUpdateKidLessonProgressDto) {
    return this.kidLearningDataService.createUpdateLearningProgress(id, data);
  }
}
