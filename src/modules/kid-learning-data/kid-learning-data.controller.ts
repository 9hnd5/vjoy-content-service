import { Authorize, Controller } from "@common";
import { Param, Post } from "@nestjs/common";
import { KidLearningDataService } from "./kid-learning-data.service";

@Controller("kid-learning-data")
export class KidLearningDataController {
  constructor(private kidLearningDataService: KidLearningDataService) {}

  @Authorize({ resource: "kid-learning-data", action: "update" })
  @Post("/:id/energy")
  buyEnergy(@Param("id") id: number) {
    return this.kidLearningDataService.buyEnergy(id);
  }
}
