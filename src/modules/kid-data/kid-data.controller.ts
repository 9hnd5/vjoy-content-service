import { Authorize, Controller } from "@common";
import { Body, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { CreateKidDataDto } from "./dto/create-kid-data.dto";
import { KidDataService } from "./kid-data.service";

@Controller()
@ApiBearerAuth()
export class KidDataController {
  constructor(private kidDataService: KidDataService) {}

  @Authorize({ resource: "kid-learning-data", action: "create" })
  @Post("kid-data")
  createKidData(@Body() data: CreateKidDataDto) {
    return this.kidDataService.create(data);
  }

  @Authorize({ resource: "kid-learning-data", action: "read" })
  @Get("kid-data/:kidId/energy")
  async getKidDataEnergy(@Param("kidId") kidId: number) {
    return this.kidDataService.getEnergy(kidId);
  }

  @Authorize({ resource: "kid-learning-data", action: "read" })
  @Get("kid-data/:kidId/star")
  async getKidDataStar(@Param("kidId") kidId: number) {
    return this.kidDataService.getStar(kidId);
  }

  @Authorize({ resource: "kid-learning-data", action: "read" })
  @Get("kid-data")
  getKidData() {
    return this.kidDataService.getDataByUser();
  }
}
