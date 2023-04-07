import { applyDecorators } from "@nestjs/common";
import { plainToInstance, Transform } from "class-transformer";
import { IsNotEmpty, ValidateNested } from "class-validator";
import { GAME_TYPE } from "entities/lesson.entity";

export function ValidateAsset(data: { type: keyof typeof GAME_TYPE; value: { new (...args: any[]): {} } }[]) {
  return applyDecorators(
    IsNotEmpty(),
    ValidateNested(),
    Transform(({ value, obj }) => {
      const assetInstance = data.find((x) => x.type === obj.gameType);
      if (!assetInstance) return undefined;
      const asset = plainToInstance(assetInstance.value, value);
      return asset;
    })
  );
}
