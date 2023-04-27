import { Authorize, Controller } from "@common";
import { Body, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { FindUnitsQueryDto } from "./dto/find-units-query.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";
import { UnitService } from "./unit.service";

@Controller("units")
export class UnitController {
  constructor(private readonly unitsService: UnitService) {}

  @Authorize({ action: "create", resource: "units" })
  @Post()
  async create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(createUnitDto);
  }

  @Authorize({ action: "list", resource: "units" })
  @Get()
  findAll(@Query() query: FindUnitsQueryDto) {
    return this.unitsService.findAll(query);
  }

  @Authorize({ action: "read", resource: "units" })
  @Get(":id")
  findOne(@Param("id") id: number) {
    return this.unitsService.findOne(id);
  }

  @Authorize({ action: "update", resource: "units" })
  @Patch(":id")
  update(@Param("id") id: number, @Body() updateUnitDto: UpdateUnitDto) {
    return this.unitsService.update(id, updateUnitDto);
  }

  @Authorize({ action: "delete", resource: "units" })
  @Delete(":id")
  remove(@Param("id") id: number, @Query("hardDelete") hardDelete: boolean) {
    return this.unitsService.remove(id, hardDelete);
  }

  @Authorize({ action: "read", resource: "units" })
  @Get(":id/unlock-final-challenge")
  unlockFinalChallenge(@Param("id") id: number) {
    return this.unitsService.unlockFinalChallenge(id);
  }
}
