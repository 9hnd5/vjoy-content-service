import { Optional } from "sequelize";
import { BelongsTo, Column, CreatedAt, ForeignKey, Model, Table, UpdatedAt } from "sequelize-typescript";
import { KidAsset } from "./kid-asset.entity";

type KidLessonAttributes = {
  id: number;
  kidAssetId: number;
  levelId: number;
  unitId: number;
  lessonId: number;
  star: number;
  createdAt: Date;
  updatedAt: Date;
};

type KidLessonCreationAttributes = Optional<KidLessonAttributes, "id" | "createdAt" | "updatedAt">;

@Table({ tableName: "kid-lessons", schema: "content" })
export class KidLesson extends Model<KidLessonAttributes, KidLessonCreationAttributes> {
  id: number;

  @ForeignKey(() => KidAsset)
  kidAssetId: number;

  @BelongsTo(() => KidAsset)
  kidAsset: KidAsset;

  @Column({ allowNull: false })
  levelId: number;

  @Column({ allowNull: false })
  unitId: number;

  @Column({ allowNull: false })
  lessonId: number;

  @Column({ allowNull: false })
  star: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
