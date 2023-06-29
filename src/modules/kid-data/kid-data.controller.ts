import { Authorize, Controller } from "@common";
import { Body, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { CreateKidDataDto } from "./dto/create-kid-data.dto";
import { UpdateKidDataDto } from "./dto/update-kid-data.dto";
import { KidDataService } from "./kid-data.service";

@Controller()
@ApiBearerAuth()
export class KidDataController {
  constructor(private kidDataService: KidDataService) {}

  @Authorize({ resource: "kid-data", action: "create" })
  @Post("kid-data")
  async createKidData(@Body() data: CreateKidDataDto) {
    return this.kidDataService.create(data);
  }

  @Authorize({ resource: "kid-data", action: "update" })
  @Patch("kid-data/:kidId")
  async updateKidData(@Param("kidId") kidId: number, @Body() data: UpdateKidDataDto) {
    return this.kidDataService.update(kidId, data);
  }

  @Authorize({ resource: "kid-data", action: "read" })
  @Get("kid-data/:kidId/energy")
  async getKidDataEnergy(@Param("kidId") kidId: number) {
    return this.kidDataService.getEnergy(kidId);
  }

  @Authorize({ resource: "kid-data", action: "update" })
  @Post("kid-data/:kidId/energy")
  async buyKidDataEnergy(@Param("kidId") kidId: number) {
    return this.kidDataService.buyEnergy(kidId);
  }

  @Authorize({ resource: "kid-data", action: "read" })
  @Get("kid-data/:kidId/star")
  async getKidDataStar(@Param("kidId") kidId: number) {
    return this.kidDataService.getStar(kidId);
  }

  @Authorize({ resource: "kid-data", action: "read" })
  @Get("kid-data")
  async getKidData() {
    return this.kidDataService.getDataByUser();
  }
}
